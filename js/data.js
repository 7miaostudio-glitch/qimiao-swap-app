// State, local cache, folders, and shared data helpers.

const KEY = 'qimiao_swap_v1';
const FOLDER_KEY = 'qimiao_swap_active_folder_v1';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
let db = { stocks: [], trades: [], orders: [], folders: [] };
let photoData = '';
let activeFolderId = localStorage.getItem(FOLDER_KEY) || '';

function normalizeDb(value = {}) {
    const folders = Array.isArray(value.folders)
        ? value.folders.filter(folder => folder && folder.id && folder.name)
        : [];
    if (!folders.length) folders.push({ id: 'big-bang', name: 'Big Bang' });
    const folderId = folders[0].id;
    const stocks = Array.isArray(value.stocks) ? value.stocks : [];
    const trades = Array.isArray(value.trades) ? value.trades : [];
    const orders = Array.isArray(value.orders) ? value.orders : [];
    for (const record of [...stocks, ...trades, ...orders]) {
        if (!folders.some(folder => folder.id === record.folderId)) record.folderId = folderId;
    }
    return { stocks, trades, orders, folders };
}

try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.stocks) && Array.isArray(saved.trades)) db = normalizeDb(saved);
} catch (error) { }
if (!db.folders.some(folder => folder.id === activeFolderId)) activeFolderId = db.folders[0].id;

window.getAppDb = () => db;
window.setAppDb = value => {
    db = normalizeDb(value);
    if (!db.folders.some(folder => folder.id === activeFolderId)) activeFolderId = db.folders[0].id;
    localStorage.setItem(FOLDER_KEY, activeFolderId);
};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = x => Math.max(0, Math.floor(Number(x) || 0));

function folderStocks() { return db.stocks.filter(stock => stock.folderId === activeFolderId) }
function folderTrades() { return db.trades.filter(trade => trade.folderId === activeFolderId) }
function folderOrders() { return db.orders.filter(order => order.folderId === activeFolderId) }
function folderName(id) { return db.folders.find(folder => folder.id === id)?.name || '未分类' }

function renderFolderSelect() {
    const select = $('folderSelect');
    if (!select) return;
    select.innerHTML = db.folders.map(folder => `<option value="${esc(folder.id)}">${esc(folder.name)}</option>`).join('');
    select.value = activeFolderId;
}

function changeFolder(id) {
    if (!db.folders.some(folder => folder.id === id)) return;
    activeFolderId = id;
    localStorage.setItem(FOLDER_KEY, id);
    render();
}

function addFolder() {
    const name = prompt('请输入新文件夹名称');
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (db.folders.some(folder => folder.name.toLowerCase() === cleanName.toLowerCase())) return alert('这个文件夹已经存在');
    const folder = { id: uid(), name: cleanName };
    db.folders.push(folder);
    activeFolderId = folder.id;
    localStorage.setItem(FOLDER_KEY, activeFolderId);
    persist();
}

function renameFolder() {
    const folder = db.folders.find(item => item.id === activeFolderId);
    if (!folder) return;
    const name = prompt('请输入新的文件夹名称', folder.name);
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (db.folders.some(item => item.id !== folder.id && item.name.toLowerCase() === cleanName.toLowerCase())) return alert('这个文件夹名称已经被使用');
    folder.name = cleanName;
    persist();
}

function waHref(phone) { let n = String(phone || '').replace(/\D/g, ''); if (n.startsWith('0')) n = '60' + n.slice(1); return 'https://wa.me/' + n }

function safeWebHref(value) { try { const url = new URL(/^https?:\/\//i.test(String(value || '')) ? String(value) : 'https://' + String(value || '')); return ['http:', 'https:'].includes(url.protocol) ? url.href : '' } catch (e) { return '' } }

function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); render(); if (window.firebaseStore) window.firebaseStore.save(db).catch(e => { console.error(e); $('syncStatus').textContent = 'Firebase 同步失败；数据仍保存在本机缓存。' }); return true } catch (e) { alert('本地储存空间不足，请缩小照片并先导出备份。'); return false } }

function giveItems(t) { return Array.isArray(t.giveItems) ? t.giveItems : (t.stockId ? [{ stockId: t.stockId, qty: num(t.qty) }] : []) }

function receiveItems(t) { return Array.isArray(t.receiveItems) ? t.receiveItems : (t.receive ? [{ name: t.receive, qty: num(t.receiveQty) }] : []) }

function sums(id) { let done = 0, pending = 0; for (const t of db.trades) { const q = giveItems(t).filter(x => x.stockId === id).reduce((a, x) => a + num(x.qty), 0); if (t.status === '已完成') done += q; if (['已约定', '已确认', '已打包', '已邮寄'].includes(t.status)) pending += q } return { done, pending } }

function saleItems(order) { return Array.isArray(order.items) ? order.items : (order.stockId ? [{ stockId: order.stockId, qty: num(order.qty), price: order.price }] : []) }

function stockTotal(id) { const stock = db.stocks.find(item => item.id === id); return num(stock?.qty) + db.orders.reduce((total, order) => total + (order.type === 'sale' ? (order.status === '已取消' ? 0 : -saleItems(order).filter(item => item.stockId === id).reduce((sum, item) => sum + num(item.qty), 0)) : (order.stockId === id ? num(order.qty) : 0)), 0) }
