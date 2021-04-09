(function(e){function t(t){for(var n,s,i=t[0],c=t[1],u=t[2],d=0,p=[];d<i.length;d++)s=i[d],Object.prototype.hasOwnProperty.call(a,s)&&a[s]&&p.push(a[s][0]),a[s]=0;for(n in c)Object.prototype.hasOwnProperty.call(c,n)&&(e[n]=c[n]);l&&l(t);while(p.length)p.shift()();return o.push.apply(o,u||[]),r()}function r(){for(var e,t=0;t<o.length;t++){for(var r=o[t],n=!0,i=1;i<r.length;i++){var c=r[i];0!==a[c]&&(n=!1)}n&&(o.splice(t--,1),e=s(s.s=r[0]))}return e}var n={},a={app:0},o=[];function s(t){if(n[t])return n[t].exports;var r=n[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,s),r.l=!0,r.exports}s.m=e,s.c=n,s.d=function(e,t,r){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},s.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)s.d(r,n,function(t){return e[t]}.bind(null,n));return r},s.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="/offline-recorder/dist/";var i=window["webpackJsonp"]=window["webpackJsonp"]||[],c=i.push.bind(i);i.push=t,i=i.slice();for(var u=0;u<i.length;u++)t(i[u]);var l=c;o.push([0,"chunk-vendors"]),r()})({0:function(e,t,r){e.exports=r("56d7")},"034f":function(e,t,r){"use strict";r("85ec")},"129e":function(e,t,r){"use strict";r("b0fa")},"56d7":function(e,t,r){"use strict";r.r(t);r("e260"),r("e6cf"),r("cca6"),r("a79d");var n=r("2b0e"),a=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{attrs:{id:"app"}},[r("h1",[e._v("离线录音机")]),r("el-card",{attrs:{shadow:"never"}},[e._v(" 一款直接在浏览器中运行的录音机，数据离线实时保存 "),r("ul",{staticStyle:{"list-style":"none"}},[r("li",[e._v(" 断电，关闭浏览器或录音时间过长超出内存等问题，都不丢失数据，重新打开继续录 ")]),r("li",[e._v(" 数据保存在浏览器中，存储在本地电脑上，保护隐私 ")]),r("li",[e._v(" 支持同时录多份录音文件，不会出现不下载就消失的情况 ")]),r("li",[e._v(" 在线播放器，可在线预览，选择下载 ")]),r("li",[e._v(" 自动记录额外信息，如录音时间段，长度大小等 ")])])]),r("div",{staticStyle:{"margin-top":"2rem"}}),r("div",[r("HelloWorld",{attrs:{msg:"Welcome to Your Vue.js App"}})],1)],1)},o=[],s=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{staticClass:"hello"},[r("el-dialog",{attrs:{visible:e.showPlayer,fullscreen:""},on:{"update:visible":function(t){e.showPlayer=t}}},[r("div",{staticClass:"player"},[r("div",{staticClass:"player_info"},[r("h3",[e._v(" 当前录音:"+e._s(null==e.nowRecordInfo?"无":e.nowRecordInfo.name)+" ")]),null!=e.nowRecordInfo?r("div",[r("el-card",{attrs:{shadow:"never"}},[r("div",[e._v("名称:"+e._s(e.nowRecordInfo["name"]))]),r("div",[e._v("ID:"+e._s(e.nowRecordInfo["id"]))]),r("div",[e._v("长度:"+e._s(e.secondToTime(e.nowRecordInfo["length"])))]),r("div",[e._v("开始时间:"+e._s(e.formatDate(e.nowRecordInfo["startTime"])))]),r("div",[e._v("结束时间:"+e._s(e.formatDate(e.nowRecordInfo["endTime"])))])])],1):e._e(),r("div",{staticStyle:{"margin-top":"2rem"}}),r("audio",{ref:"player",staticStyle:{outline:"none"},attrs:{src:e.src,controls:""}}),r("div",{staticStyle:{"margin-top":"2rem"}}),r("div",[r("el-button",{attrs:{type:"danger"},on:{click:e.download}},[e._v("下载")]),r("el-button",{attrs:{type:"primary"},on:{click:e.clear}},[e._v("清除历史记录")])],1)]),r("div",{staticClass:"player_list"},[r("el-table",{attrs:{border:"",data:e.playList}},[r("el-table-column",{attrs:{label:"名称",prop:"name"}}),r("el-table-column",{attrs:{width:"150px",label:"大小",prop:"size"}}),r("el-table-column",{attrs:{width:"100px",label:"长度",prop:"length"}}),r("el-table-column",{attrs:{label:"操作"},scopedSlots:e._u([{key:"default",fn:function(t){return[r("el-button",{attrs:{type:"primary",size:"small"},on:{click:function(r){return e.select(t.row.id)}}},[e._v("查看")]),r("el-button",{attrs:{type:"danger",size:"small"},on:{click:function(r){return e.playlist_del(t.row.id)}}},[e._v("删除")]),r("el-button",{attrs:{type:"success",size:"small"},on:{click:function(r){return e.playlist_download(t.row.id)}}},[e._v("下载")]),r("el-tooltip",{attrs:{placement:"top"}},[r("template",{slot:"content"},e._l(e.info_generate(t.row.id),(function(t,n){return r("div",{key:n},[e._v(" "+e._s(t)+" ")])})),0),r("el-button",{attrs:{type:"info",size:"small"}},[e._v("信息")])],2)]}}])})],1)],1)])]),r("div",{directives:[{name:"loading",rawName:"v-loading",value:e.stopping||e.loading,expression:"stopping||loading"}],staticClass:"recorder"},[r("h2",[e._v("当前录制:"+e._s(e.recordTime))]),r("div"),"normal"==e.nowState||"stopped"==e.nowState?r("el-button",{attrs:{type:"success"},on:{click:e.start}},[e._v("开始")]):e._e(),"paused"==e.nowState?r("el-button",{attrs:{type:"success"},on:{click:e.resume}},[e._v("继续")]):e._e(),"recording"==e.nowState?r("el-button",{attrs:{type:"primary"},on:{click:e.pause}},[e._v("暂停")]):e._e(),"recording"==e.nowState||"paused"==e.nowState?r("el-button",{attrs:{type:"danger"},on:{click:e.stop}},[e._v("停止")]):e._e(),"stopped"==e.nowState?r("el-button",{attrs:{type:"primary"},on:{click:e.download}},[e._v("下载当前录音")]):e._e(),"stopped"==e.nowState?r("el-button",{attrs:{type:"danger"},on:{click:e.removeNow}},[e._v("删除")]):e._e(),r("el-button",{attrs:{type:"warning"},on:{click:e.show_player}},[e._v("显示播放器")])],1)],1)},i=[],c=r("b85c"),u=r("1da1"),l=(r("d3b7"),r("3ca3"),r("ddb0"),r("d81d"),r("b0c0"),r("99af"),r("2b3d"),r("4de4"),r("96cf"),r("edfe")),d=r("3ad6"),p=r("cee5"),f=r.n(p),m=r("cff8"),h=r.n(m),w=r("5a0c"),b="historyBlobs",v="historyBlobsInfoMap",g="tempcache",y=Object(l["b"])(g,g),x="recordingInfo",R={name:"HelloWorld",props:{msg:String},mounted:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){var r,n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,navigator.mediaDevices.getUserMedia({audio:!0,video:!1});case 2:return r=t.sent,n=new MediaRecorder(r,{bitsPerSecond:128e3,audioBitrateMode:"variable",mimeType:"audio/webm"}),n.ondataavailable=function(t){return e.dataavailable(t)},e.recorder=n,e.loadHistoryIdx(),t.next=9,e.tempCacheEmpty();case 9:if(t.sent){t.next=14;break}return e.loading=!0,t.next=13,e.startFormTempCache();case 13:e.loading=!1;case 14:case"end":return t.stop()}}),t)})))()},data:function(){return{loading:!1,player:null,startTime:new Date,endTime:new Date,nowRecordInfo:null,blobs:[],mergedBlob:null,recorder:null,src:"",historyBlobsIdx:[],historyInfoMap:{},nowState:"normal",showPlayer:!1,stopping:!1}},computed:{recordTime:function(){return w(0).second(this.blobs.length).subtract(8,"hours").format("HH:mm:ss")}},asyncComputed:{playList:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,Promise.all(e.historyBlobsIdx.map(function(){var t=Object(u["a"])(regeneratorRuntime.mark((function t(r){var n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.readHistoryItem(r);case 2:return n=t.sent,t.abrupt("return",{name:e.historyInfoMap[r].name,id:r,size:f()(n.size),length:e.secondToTime(e.historyInfoMap[r].length)});case 4:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}()));case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}}),t)})))()}},methods:{show_player:function(){this.showPlayer=!0},formatDate:function(e){return w(e).format("YYYY-MM-DD HH:mm:ss")},secondToTime:function(e){return w(0).second(e).subtract(8,"hours").format("HH:mm:ss")},info_generate:function(e){var t=[],r=this.historyInfoMap[e];for(var n in r){var a="startTime"==n||"endTime"==n?this.formatDate(r[n]):"length"==n?this.secondToTime(r[n]):r[n];t.push("".concat(n,"：").concat(a))}return t},playlist_del:function(e){var t=this;return Object(u["a"])(regeneratorRuntime.mark((function r(){var n,a;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return n=t.historyInfoMap[e],r.next=3,t.$confirm("是否要删除:"+n.name+"?");case 3:if(a=r.sent,"confirm"!=a){r.next=8;break}return e==t.nowRecordInfo.id&&t.clearNow(),r.next=8,t.removeItem(e);case 8:case"end":return r.stop()}}),r)})))()},playlist_download:function(e){var t=this;return Object(u["a"])(regeneratorRuntime.mark((function r(){var n;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return n=t.historyInfoMap[e],t.$message.info("已开始下载："+n.name),r.t0=t,r.t1=n.name,r.t2=URL,r.next=7,t.readHistoryItem(e);case 7:r.t3=r.sent,r.t4=r.t2.createObjectURL.call(r.t2,r.t3),r.t0.downloadUrl.call(r.t0,r.t1,r.t4);case 10:case"end":return r.stop()}}),r)})))()},play:function(){var e=this.$refs.player;e.play()},play_pause:function(){var e=this.$refs.player;e.pause()},play_stop:function(){var e=this.$refs.player;e.fastSeek(0),this.play_pause()},select:function(e){var t=this;console.log(e),"recording"!=this.nowState?(this.clearNow(),this.readHistoryItem(e).then((function(r){t.loadNow(e,r)}))):this.$message.error("不能在录音时进行播放，请先停止录音")},stateSwitch:function(e){this.nowState=e},dataavailable:function(e){var t=this;return Object(u["a"])(regeneratorRuntime.mark((function r(){var n;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return n=t.stopping,t.stopping&&(t.stopping=!1),t.blobs.push(e.data),t.endTime=new Date,console.log(e),r.next=7,t.addRecordFrame(e.data);case 7:return r.next=9,t.storeRecording();case 9:if(!n){r.next=12;break}return r.next=12,t.stop_after();case 12:case"end":return r.stop()}}),r)})))()},start:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.clearNow(),e.startTime=new Date,e.endTime=new Date,e.recorder.start(1e3),t.next=6,e.storeRecording();case 6:e.stateSwitch("recording");case 7:case"end":return t.stop()}}),t)})))()},startFormTempCache:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.tempCacheEmpty();case 2:if(!t.sent){t.next=4;break}throw new Error("不存在上次记录");case 4:return t.next=6,e.loadTempCache();case 6:return e.blobs=t.sent,t.next=9,h.a.get(x);case 9:r=t.sent,e.startTime=r["startTime"],e.endTime=r["endTime"],e.recorder.start(1e3),e.stateSwitch("recording"),e.pause();case 15:case"end":return t.stop()}}),t)})))()},storeRecording:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,h.a.set(x,{startTime:e.startTime,endTime:e.endTime});case 2:case"end":return t.stop()}}),t)})))()},addRecordFrame:function(e){var t=this;return Object(u["a"])(regeneratorRuntime.mark((function r(){var n;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return n=t.blobs.length-1,r.next=3,Object(l["g"])(n,e,y);case 3:case"end":return r.stop()}}),r)})))()},resume:function(){var e=this.recorder;e.resume(),this.stateSwitch("recording")},pause:function(){var e=this.recorder;e.pause(),this.stateSwitch("paused")},clearTempCache:function(){return Object(u["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,Object(l["a"])(y);case 2:case"end":return e.stop()}}),e)})))()},tempCacheEmpty:function(){return Object(u["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,Object(l["f"])(y);case 2:return e.t0=e.sent.length,e.abrupt("return",0==e.t0);case 4:case"end":return e.stop()}}),e)})))()},loadTempCache:function(){return Object(u["a"])(regeneratorRuntime.mark((function e(){var t,r;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,Object(l["d"])(y);case 2:return t=e.sent,t=t.sort((function(e,t){e[0],t[0]})),r=t.map((function(e){return e[1]})),e.abrupt("return",r);case 6:case"end":return e.stop()}}),e)})))()},stop:function(){var e=this;this.recorder.stop(),this.stopping=!0,Object(d["delay"])(1500).then((function(){e.stopping&&(e.stopping=!1),e.stop_after()}))},stop_after:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){var r,n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,Object(d["delay"])(0);case 2:return e.stateSwitch("merging"),e.mergeBlobs(e.blobs),e.pushToHistory(),t.next=7,e.clearTempCache();case 7:return e.stateSwitch("stopped"),t.next=10,e.$prompt("请输入名称:","命名录音",{showCancelButton:!1,inputValue:e.nowRecordInfo.id});case 10:if(r=t.sent,"confirm"!=r.action){t.next=23;break}return n=e.nowRecordInfo.id,t.next=15,e.renameItem(e.nowRecordInfo.id,r.value);case 15:return t.t0=e,t.t1=r.value,t.next=19,e.readHistoryItem(n);case 19:t.t2=t.sent,t.t0.loadNow.call(t.t0,t.t1,t.t2),t.next=25;break;case 23:return t.next=25,e.$alert("错误");case 25:case"end":return t.stop()}}),t)})))()},download:function(){""!=this.src&&(this.$message.info("已开始下载："+this.nowRecordInfo.name),this.downloadUrl(this.nowRecordInfo.name,this.src))},removeNow:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.playlist_del(e.nowRecordInfo.id);case 2:case"end":return t.stop()}}),t)})))()},clear:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,e.$confirm("确定要清除所有记录吗?",{type:"warning"});case 2:r=t.sent,"confirm"==r&&e.clearHistroy();case 4:case"end":return t.stop()}}),t)})))()},downloadUrl:function(e,t){var r=document.createElement("a");r.download=e,r.href=t,r.click()},mergeBlobs:function(e){var t=new Blob(e,{type:"audio/webm"});this.src=URL.createObjectURL(t),this.mergedBlob=t;var r="record_".concat(w(this.startTime).format("YYYY-MM-DD hh:mm:ss"),"_").concat(w(this.endTime).format("YYYY-MM-DD hh:mm:ss"));this.nowRecordInfo={name:r,id:r,startTime:this.startTime,endTime:this.endTime,timeSpanList:[],length:e.length}},clearNow:function(){null!=this.src&&""!=this.src&&(URL.revokeObjectURL(this.src),this.src="",this.mergedBlob=null,this.blobs=[],this.nowRecordInfo=null)},loadNow:function(e,t){this.clearNow(),this.mergedBlob=t,this.blobs=[],this.nowRecordInfo=this.historyInfoMap[e],this.src=URL.createObjectURL(t)},pushToHistory:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(-1==e.historyBlobsIdx.indexOf(e.nowRecordInfo.id)){t.next=2;break}throw new Error("已经存在同名历史记录");case 2:if(null!=e.mergedBlob&&null!=e.nowRecordInfo.id){t.next=4;break}throw new Error("错误调用");case 4:return t.next=6,e.addItem(e.nowRecordInfo,e.mergedBlob);case 6:case"end":return t.stop()}}),t)})))()},addItem:function(e,t){var r=this;return Object(u["a"])(regeneratorRuntime.mark((function n(){return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return r.historyBlobsIdx.push(e.id),h()(b,r.historyBlobsIdx),r.historyInfoMap[e.id]=e,h()(v,r.historyInfoMap),n.next=6,Object(l["g"])(b+e.id,t);case 6:case"end":return n.stop()}}),n)})))()},loadHistoryIdx:function(){h.a.has(b)?this.historyBlobsIdx=h.a.get(b):this.historyBlobsIdx=[],h.a.has(v)?this.historyInfoMap=h.a.get(v):this.historyInfoMap={}},clearHistroy:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function t(){var r,n,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:r=Object(c["a"])(e.historyBlobsIdx),t.prev=1,r.s();case 3:if((n=r.n()).done){t.next=9;break}return a=n.value,t.next=7,Object(l["c"])(b+a);case 7:t.next=3;break;case 9:t.next=14;break;case 11:t.prev=11,t.t0=t["catch"](1),r.e(t.t0);case 14:return t.prev=14,r.f(),t.finish(14);case 17:h.a.remove(b),h.a.remove(v),e.clearNow(),e.loadHistoryIdx();case 21:case"end":return t.stop()}}),t,null,[[1,11,14,17]])})))()},readHistoryItem:function(e){var t=this;return Object(u["a"])(regeneratorRuntime.mark((function r(){var n;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:if(-1!=t.historyBlobsIdx.indexOf(e)){r.next=2;break}throw new Error("记录"+e+"不存在");case 2:return r.next=4,Object(l["e"])(b+e);case 4:return n=r.sent,r.abrupt("return",n);case 6:case"end":return r.stop()}}),r)})))()},removeItem:function(e){var t=this;return Object(u["a"])(regeneratorRuntime.mark((function r(){return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:if(-1!=t.historyBlobsIdx.indexOf(e)){r.next=2;break}throw new Error("没有这个记录");case 2:return t.historyBlobsIdx=t.historyBlobsIdx.filter((function(t){return t!=e})),delete t.historyInfoMap[e],h.a.set(v,t.historyInfoMap),h.a.set(b,t.historyBlobsIdx),r.next=8,Object(l["c"])(b+e);case 8:case"end":return r.stop()}}),r)})))()},renameItem:function(e,t){var r=this;return Object(u["a"])(regeneratorRuntime.mark((function n(){var a,o;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:if(-1!=r.historyBlobsIdx.indexOf(e)){n.next=2;break}throw new Error("没有这个记录");case 2:return n.next=4,r.readHistoryItem(e);case 4:return a=n.sent,o=r.historyInfoMap[e],n.next=8,r.removeItem(e);case 8:return o.name=t,n.next=11,r.addItem(o,a);case 11:case"end":return n.stop()}}),n)})))()}}},_=R,I=(r("129e"),r("2877")),k=Object(I["a"])(_,s,i,!1,null,"6d8e68de",null),O=k.exports,j={name:"App",components:{HelloWorld:O}},T=j,S=(r("034f"),Object(I["a"])(T,a,o,!1,null,null,null)),M=S.exports,B=r("5c96"),H=(r("0fae"),r("4380")),D=r("ead5"),C=r.n(D),P=r("3003");n["default"].config.productionTip=!1,n["default"].use(B),n["default"].use(H["a"]),n["default"].use(P["a"]),n["default"].use(C.a,{name:"ls",bind:!0}),new n["default"]({render:function(e){return e(M)}}).$mount("#app")},"85ec":function(e,t,r){},b0fa:function(e,t,r){}});
//# sourceMappingURL=app.47bad01b.js.map