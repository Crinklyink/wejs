/* Buy orders reserve cash. Sell orders reserve shares so a night on the farm
   can safely cross a limit while the rest of the portfolio remains liquid. */
if(!Array.isArray(state.orders))state.orders=[];
const reservedCash=()=>state.orders.reduce((n,o)=>n+(o.buy?o.reserve:0),0);
const availableShares=i=>state.stocks[i].shares-state.orders.reduce((n,o)=>n+(!o.buy&&o.stock===i?o.qty:0),0);
function settleOrder(i,qty,buy,price){
 const q=state.stocks[i],value=roundCash(price*qty);if(buy)q.basis=(q.basis*q.shares+value)/(q.shares+qty);
 q.shares+=buy?qty:-qty;if(!q.shares)q.basis=0;state.cash=roundCash(state.cash+(buy?-value:value));state.goals.trade=true
}
function placeLimit(i,qty,buy,limit){
 if(state.world!=='city'||!Number.isSafeInteger(qty)||qty<1||qty>999999||!Number.isFinite(limit)||limit<.01||limit>1000000)return 'Enter a share count and a positive limit price.';
 if(state.orders.length>=8)return 'Eight orders are already open.';
 limit=roundCash(limit);const reserve=buy?roundCash(qty*limit):0;
 if(buy&&reserve>state.cash)return 'Buying power is '+dollars(state.cash)+'.';
 if(!buy&&qty>availableShares(i))return 'Available shares: '+availableShares(i)+'.';
 const id=(state.orderSerial||0)+1;state.orderSerial=id;state.cash=roundCash(state.cash-reserve);state.orders.push({id,stock:i,qty,buy,limit,reserve});
 const msg=(buy?'Buy':'Sell')+' limit placed: '+qty+' '+STOCKS[i].id+' at '+dollars(limit)+'.';state.goals.trade=true;logEvent(msg,'chart');
 const fills=matchOrders();persist();return fills.find(o=>o.id===id)?.text||msg
}
function matchOrders(){
 const pending=[],fills=[];for(const o of state.orders||[]){const q=state.stocks[o.stock];
   if(o.buy?q.price>o.limit:q.price<o.limit){pending.push(o);continue}
   if(o.buy)state.cash=roundCash(state.cash+o.reserve);settleOrder(o.stock,o.qty,o.buy,q.price);
   const text=(o.buy?'Bought ':'Sold ')+o.qty+' '+STOCKS[o.stock].id+' at '+dollars(q.price)+' on limit.';logEvent(text,'chart');fills.push({id:o.id,text})
 }state.orders=pending;return fills
}
function cancelOrder(id){const o=state.orders.find(x=>x.id===id);if(!o)return;if(o.buy)state.cash=roundCash(state.cash+o.reserve);state.orders=state.orders.filter(x=>x.id!==id);logEvent('Cancelled '+STOCKS[o.stock].id+' limit order.','chart');persist()}
function orderListHTML(){return '<h3>Open orders</h3>'+(state.orders.length?state.orders.map(o=>'<div class="hold-row"><div><b>'+STOCKS[o.stock].id+'</b><small>'+(o.buy?'Buy ':'Sell ')+o.qty+' at '+dollars(o.limit)+(o.buy?' · '+dollars(o.reserve)+' reserved':'')+'</small></div><button class="chip" data-cancel="'+o.id+'">Cancel</button></div>').join(''):'<div class="empty">No open limit orders.</div>')}

