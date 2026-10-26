// JSON/CSV export, import, and reset actions.



function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000) } 

function exportJSON() { download('物料互换备份_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(db, null, 2), 'application/json') } 

function csvRow(a) { return a.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',') } 

function exportCSV() { const rows = [['类型', '名称/交换对象', 'IG', '电话号码', '微信号', '交换方式', '物料', '初始数量', '送出数量', '收到物料', '收到数量', '状态', '日期', '备注']]; db.stocks.forEach(s => rows.push(['库存', s.name, '', '', '', '', '', s.qty, '', '', '', '', '', s.note])); db.trades.forEach(t => rows.push(['交换', t.person, t.account, t.phone || '', t.wechat || '', t.method || '邮寄', giveItems(t).map(x => `${db.stocks.find(s => s.id === x.stockId)?.name || '已删除物料'} × ${x.qty}`).join('、'), giveItems(t).reduce((a, x) => a + num(x.qty), 0), receiveItems(t).map(x => `${x.name} × ${x.qty}`).join('、'), receiveItems(t).reduce((a, x) => a + num(x.qty), 0), t.status, t.date, t.note])); download('物料互换记录.csv', '\ufeff' + rows.map(csvRow).join('\r\n'), 'text/csv;charset=utf-8') } 

function importJSON(input) { const f = input.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!Array.isArray(d.stocks) || !Array.isArray(d.trades)) throw Error('bad'); if (!confirm('恢复备份将覆盖当前全部数据，确定继续？')) return; db = d; persist(); alert('恢复成功') } catch (e) { alert('备份文件格式不正确') } finally { input.value = '' } }; r.readAsText(f) } 

function clearAll() { if (confirm('确定清空所有物料与交换记录吗？此操作无法撤销。') && confirm('请确认已经备份，真的要清空吗？')) { db = { stocks: [], trades: [] }; persist() } } render();
