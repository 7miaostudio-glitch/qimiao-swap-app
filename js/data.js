// State, local cache, and shared data helpers.

const KEY = 'qimiao_swap_v1'; let db = { stocks: [], trades: [] }, photoData = ''; try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.stocks) && Array.isArray(d.trades)) db = d } catch (e) { } window.getAppDb = () => db; window.setAppDb = value => { db = value }; const $ = id => document.getElementById(id); const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); const num = x => Math.max(0, Math.floor(Number(x) || 0)); const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8); 

function waHref(phone) { let n = String(phone || '').replace(/\D/g, ''); if (n.startsWith('0')) n = '60' + n.slice(1); return 'https://wa.me/' + n } 

function safeWebHref(value) { try { const url = new URL(/^https?:\/\//i.test(String(value || '')) ? String(value) : 'https://' + String(value || '')); return ['http:', 'https:'].includes(url.protocol) ? url.href : '' } catch (e) { return '' } } 

function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); render(); if (window.firebaseStore) window.firebaseStore.save(db).catch(e => { console.error(e); $('syncStatus').textContent = 'Firebase 同步失败；数据仍保存在本机缓存。' }); return true } catch (e) { alert('本地储存空间不足，请缩小照片并先导出备份。'); return false } } 

function giveItems(t) { return Array.isArray(t.giveItems) ? t.giveItems : (t.stockId ? [{ stockId: t.stockId, qty: num(t.qty) }] : []) } 

function receiveItems(t) { return Array.isArray(t.receiveItems) ? t.receiveItems : (t.receive ? [{ name: t.receive, qty: num(t.receiveQty) }] : []) } 

function sums(id) { let done = 0, pending = 0; for (const t of db.trades) { const q = giveItems(t).filter(x => x.stockId === id).reduce((a, x) => a + num(x.qty), 0); if (t.status === '已完成') done += q; if (t.status === '已约定') pending += q } return { done, pending } }
