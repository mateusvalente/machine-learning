// =============================================================================
// RBF PARA CLASSIFICAÇÃO NÃO LINEAR
// Centros fixos; pesos e bias da saída linear treinados pela Regra Delta.
// =============================================================================
(function () {
  'use strict';
  var data = [
    [-0.9,0.5,0],[-0.6,-0.7,0],[-0.2,0.2,0],[0.1,-0.4,0],[0.3,0.7,0],[0.6,-0.2,0],[0.8,0.4,0],[-0.8,-0.1,0],[0,0.9,0],[-0.2,-0.9,0],
    [2.4,0.2,1],[2.8,-0.3,1],[3.2,0.4,1],[2.6,0.8,1],[-2.3,0.2,1],[-2.8,0.7,1],[-3.1,0.1,1],[-2.5,1.2,1],
    [-0.5,-2.5,1],[0,-3.0,1],[0.6,-2.6,1],[-0.3,-3.3,1],[0.5,-3.2,1]
  ];
  var centers = [[0,0],[0.8,0.2],[-0.7,-0.3],[2.8,0],[-2.7,0.5],[0,-2.8]];
  var centerClasses = [0,0,0,1,1,1];
  var weights = [0,0,0,0,0,0];
  var bias = 0;
  var gamma = 0.85;
  var learningRate = 0.12;
  var epoch = 0;
  var history = [];
  var lastStep = null;
  var viewedPoint = data[0];
  var testPoint = null;
  var plane = document.getElementById('rbfClassPlane');
  var planeContext = plane.getContext('2d');
  var network = document.getElementById('rbfClassNetwork');
  var networkContext = network.getContext('2d');
  var chart = document.getElementById('rbfClassHistory');
  var chartContext = chart.getContext('2d');
  var margin = 62;

  function number(value,digits){var safe=Math.abs(value)<0.0000001?0:value;return safe.toFixed(digits).replace('.',',');}
  function squaredDistance(point,center){var dx=point[0]-center[0];var dy=point[1]-center[1];return dx*dx+dy*dy;}
  function gaussian(point,center){return Math.exp(-gamma*squaredDistance(point,center));}
  function forward(point){var activations=[];var u=bias;for(var j=0;j<centers.length;j++){activations[j]=gaussian(point,centers[j]);u=u+weights[j]*activations[j];}return{activations:activations,u:u,prediction:u>=0.5?1:0};}
  function snapshot(values){var copy=[];for(var i=0;i<values.length;i++)copy[i]=values[i];return copy;}

  function trainSample(sample){var beforeWeights=snapshot(weights);var beforeBias=bias;var result=forward(sample);var error=sample[2]-result.u;for(var j=0;j<weights.length;j++)weights[j]=weights[j]+learningRate*error*result.activations[j];bias=bias+learningRate*error;lastStep={sample:[sample[0],sample[1],sample[2]],result:result,error:error,beforeWeights:beforeWeights,beforeBias:beforeBias,afterWeights:snapshot(weights),afterBias:bias};viewedPoint=sample;}
  function trainEpoch(){for(var i=0;i<data.length;i++)trainSample(data[i]);epoch++;recordHistory();}
  function metrics(){var mse=0;var correct=0;for(var i=0;i<data.length;i++){var result=forward(data[i]);var error=data[i][2]-result.u;mse=mse+error*error;if(result.prediction===data[i][2])correct++;}return{mse:mse/data.length,accuracy:correct/data.length};}
  function recordHistory(){var current=metrics();history.push([epoch,current.mse,current.accuracy]);if(history.length>301)history.shift();}

  function mapX(value){return margin+(value+4)*(plane.width-2*margin)/8;}
  function mapY(value){return plane.height-margin-(value+4)*(plane.height-2*margin)/8;}
  function unmapX(pixel){return -4+(pixel-margin)*8/(plane.width-2*margin);}
  function unmapY(pixel){return -4+(plane.height-margin-pixel)*8/(plane.height-2*margin);}
  function drawPlane(){planeContext.clearRect(0,0,plane.width,plane.height);planeContext.fillStyle='#fbfcff';planeContext.fillRect(0,0,plane.width,plane.height);var cell=10;for(var px=margin;px<plane.width-margin;px+=cell){for(var py=margin;py<plane.height-margin;py+=cell){planeContext.fillStyle=forward([unmapX(px),unmapY(py)]).prediction===0?'rgba(78,70,229,.11)':'rgba(239,130,68,.12)';planeContext.fillRect(px,py,cell,cell);}}
    planeContext.font='600 13px DM Mono';for(var tick=-4;tick<=4;tick++){var x=mapX(tick),y=mapY(tick);planeContext.beginPath();planeContext.moveTo(x,margin);planeContext.lineTo(x,plane.height-margin);planeContext.moveTo(margin,y);planeContext.lineTo(plane.width-margin,y);planeContext.strokeStyle=tick===0?'#9ea7b9':'#e5e8f0';planeContext.lineWidth=tick===0?2:1;planeContext.stroke();planeContext.fillStyle='#647086';planeContext.textAlign='center';planeContext.textBaseline='top';planeContext.fillText(String(tick),x,plane.height-margin+13);if(tick!==0){planeContext.textAlign='right';planeContext.textBaseline='middle';planeContext.fillText(String(tick),margin-11,y);}}
    var view=forward(viewedPoint);for(var c=0;c<centers.length;c++){if(view.activations[c]>0.12){planeContext.beginPath();planeContext.moveTo(mapX(viewedPoint[0]),mapY(viewedPoint[1]));planeContext.lineTo(mapX(centers[c][0]),mapY(centers[c][1]));planeContext.setLineDash([5,5]);planeContext.strokeStyle=centerClasses[c]===0?'rgba(78,70,229,.65)':'rgba(239,130,68,.7)';planeContext.lineWidth=2;planeContext.stroke();planeContext.setLineDash([]);}}
    for(var i=0;i<data.length;i++){var dx=mapX(data[i][0]),dy=mapY(data[i][1]);planeContext.beginPath();if(data[i][2]===0)planeContext.arc(dx,dy,7,0,Math.PI*2);else planeContext.rect(dx-6,dy-6,12,12);planeContext.fillStyle=data[i][2]===0?'#4e46e5':'#ef8244';planeContext.fill();planeContext.strokeStyle='#fff';planeContext.lineWidth=2;planeContext.stroke();}
    for(c=0;c<centers.length;c++){var cx=mapX(centers[c][0]),cy=mapY(centers[c][1]);planeContext.beginPath();planeContext.arc(cx,cy,15,0,Math.PI*2);planeContext.fillStyle='#fff';planeContext.fill();planeContext.strokeStyle=centerClasses[c]===0?'#4e46e5':'#ef8244';planeContext.lineWidth=5;planeContext.stroke();planeContext.fillStyle='#172033';planeContext.font='800 12px Manrope';planeContext.textAlign='center';planeContext.textBaseline='middle';planeContext.fillText('c'+(c+1),cx,cy);}
    if(testPoint){planeContext.beginPath();planeContext.arc(mapX(testPoint[0]),mapY(testPoint[1]),11,0,Math.PI*2);planeContext.fillStyle='#fff';planeContext.fill();planeContext.strokeStyle='#172033';planeContext.lineWidth=4;planeContext.stroke();}
    planeContext.fillStyle='#354058';planeContext.font='800 15px Manrope';planeContext.textAlign='center';planeContext.fillText('x₁',plane.width-margin+28,mapY(0));planeContext.fillText('x₂',mapX(0),margin-28);
  }

  function nodeY(index,count,height){var top=70,bottom=height-45;return count===1?(top+bottom)/2:top+index*(bottom-top)/(count-1);}
  function drawNetwork(){networkContext.clearRect(0,0,network.width,network.height);var result=forward(viewedPoint);var xInput=105,xHidden=470,xOutput=835;for(var h=0;h<6;h++){for(var input=0;input<2;input++){networkContext.beginPath();networkContext.moveTo(xInput+25,nodeY(input,2,network.height));networkContext.lineTo(xHidden-25,nodeY(h,6,network.height));networkContext.strokeStyle='rgba(78,70,229,.18)';networkContext.lineWidth=1.5;networkContext.stroke();}networkContext.beginPath();networkContext.moveTo(xHidden+25,nodeY(h,6,network.height));networkContext.lineTo(xOutput-28,nodeY(0,1,network.height));networkContext.strokeStyle=weights[h]>=0?'rgba(25,169,135,.55)':'rgba(239,130,68,.55)';networkContext.lineWidth=1+Math.min(3,Math.abs(weights[h])*2);networkContext.stroke();}
    drawLayerTitle(networkContext,xInput,'ENTRADAS');drawLayerTitle(networkContext,xHidden,'CAMADA RBF');drawLayerTitle(networkContext,xOutput,'SAÍDA');for(input=0;input<2;input++)drawNode(networkContext,xInput,nodeY(input,2,network.height),'x'+(input+1),number(viewedPoint[input],2),'#4e46e5');for(h=0;h<6;h++)drawNode(networkContext,xHidden,nodeY(h,6,network.height),'φ'+(h+1),number(result.activations[h],3),centerClasses[h]===0?'#4e46e5':'#ef8244');drawNode(networkContext,xOutput,nodeY(0,1,network.height),'u',number(result.u,3),'#19a987');}
  function drawLayerTitle(ctx,x,label){ctx.fillStyle='#eef0ff';ctx.fillRect(x-73,15,146,32);ctx.fillStyle='#4e46c5';ctx.font='800 13px Manrope';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,31);}
  function drawNode(ctx,x,y,label,value,color){ctx.beginPath();ctx.arc(x,y,27,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#172033';ctx.font='800 12px Manrope';ctx.textAlign='center';ctx.fillText(label,x,y-4);ctx.fillStyle='#647086';ctx.font='600 9px DM Mono';ctx.fillText(value,x,y+11);}

  function drawHistory(){drawDualChart(chartContext,chart,history,1,2,'#e35c6e','#19a987');}
  function drawDualChart(ctx,target,values,firstColumn,secondColumn,colorOne,colorTwo){var left=66,right=28,top=25,bottom=58;ctx.clearRect(0,0,target.width,target.height);ctx.fillStyle='#fbfcff';ctx.fillRect(0,0,target.width,target.height);var maxLoss=.1;for(var i=0;i<values.length;i++)if(values[i][firstColumn]>maxLoss)maxLoss=values[i][firstColumn];maxLoss*=1.08;ctx.font='600 12px Manrope';for(var t=0;t<=5;t++){var y=top+t*(target.height-top-bottom)/5;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(target.width-right,y);ctx.strokeStyle='#e4e7ef';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#647086';ctx.textAlign='right';ctx.fillText(number(maxLoss*(5-t)/5,2),left-9,y+4);ctx.textAlign='left';ctx.fillText(number((5-t)*20,0)+'%',target.width-right+5,y+4);}var firstEpoch=values[0][0],lastEpoch=values[values.length-1][0],range=Math.max(1,lastEpoch-firstEpoch);ctx.textAlign='center';for(t=0;t<=5;t++){var x=left+t*(target.width-left-right)/5;ctx.fillText(String(Math.round(firstEpoch+range*t/5)),x,target.height-bottom+18);}plotLine(ctx,target,values,firstColumn,colorOne,left,right,top,bottom,range,firstEpoch,maxLoss,false);plotLine(ctx,target,values,secondColumn,colorTwo,left,right,top,bottom,range,firstEpoch,1,true);}
  function plotLine(ctx,target,values,column,color,left,right,top,bottom,range,firstEpoch,maximum){ctx.beginPath();for(var i=0;i<values.length;i++){var x=left+(values[i][0]-firstEpoch)*(target.width-left-right)/range;var y=top+(1-values[i][column]/maximum)*(target.height-top-bottom);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle=color;ctx.lineWidth=4;ctx.stroke();if(values.length===1){ctx.beginPath();ctx.arc(left,top+(1-values[0][column]/maximum)*(target.height-top-bottom),5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}}

  function renderMath(){var container=document.getElementById('rbfClassMath');if(!lastStep){container.innerHTML='<p>Treine uma época para abrir as contas.</p>';return;}var s=lastStep;var distanceLines='',activationLines='',sumTerms='';for(var j=0;j<centers.length;j++){distanceLines+='‖x−c'+(j+1)+'‖² = '+number(squaredDistance(s.sample,centers[j]),4)+(j<5?'<br>':'');activationLines+='φ'+(j+1)+' = e<sup>−0,85×'+number(squaredDistance(s.sample,centers[j]),4)+'</sup> = '+number(s.result.activations[j],4)+(j<5?'<br>':'');sumTerms+='('+number(s.beforeWeights[j],3)+'×'+number(s.result.activations[j],3)+')'+(j<5?' + ':'');}var updateLines='';for(j=0;j<weights.length;j++)updateLines+='w'+(j+1)+' novo = '+number(s.beforeWeights[j],4)+' + 0,12×'+number(s.error,4)+'×'+number(s.result.activations[j],4)+' = <strong>'+number(s.afterWeights[j],4)+'</strong><br>';container.innerHTML='<article><b>1 · Amostra</b><p>Entrada e alvo.</p><code>x=['+number(s.sample[0],2)+'; '+number(s.sample[1],2)+']<br>y='+s.sample[2]+'</code></article><article><b>2 · Distâncias²</b><p>Uma distância para cada centro.</p><code>'+distanceLines+'</code></article><article><b>3 · Gaussianas</b><p>Distâncias viram ativações locais.</p><code>'+activationLines+'</code></article><article><b>4 · Saída e erro linear</b><p>O Step só decide a classe; o treinamento usa u contínuo.</p><code>u='+number(s.beforeBias,3)+' + '+sumTerms+' = <strong>'+number(s.result.u,4)+'</strong><br>e=y−u='+s.sample[2]+'−'+number(s.result.u,4)+'=<strong>'+number(s.error,4)+'</strong></code></article><article class="full"><b>5 · Pesos e bias</b><p>Quanto maior φⱼ, maior a responsabilidade de wⱼ nessa amostra.</p><code>'+updateLines+'b novo = '+number(s.beforeBias,4)+' + 0,12×'+number(s.error,4)+' = <strong>'+number(s.afterBias,4)+'</strong></code></article>';}
  function renderTable(){var html='<thead><tr><th>#</th><th>x₁</th><th>x₂</th><th>y</th><th>u</th><th>ŷ</th><th>e = y−u</th></tr></thead><tbody>';for(var i=0;i<data.length;i++){var result=forward(data[i]);html+='<tr><td>'+(i+1)+'</td><td>'+number(data[i][0],2)+'</td><td>'+number(data[i][1],2)+'</td><td>'+data[i][2]+'</td><td>'+number(result.u,4)+'</td><td class="'+(result.prediction===data[i][2]?'correct':'incorrect')+'">'+result.prediction+'</td><td class="error-value">'+number(data[i][2]-result.u,4)+'</td></tr>';}document.getElementById('rbfClassTable').innerHTML=html+'</tbody>';}
  function renderMetrics(){var current=metrics();document.getElementById('rbfClassEpoch').textContent=epoch;document.getElementById('rbfClassLoss').textContent=number(current.mse,4);document.getElementById('rbfClassAccuracy').textContent=number(current.accuracy*100,1)+'%';var status=document.getElementById('rbfClassStatus');status.textContent=epoch===0?'Saída não treinada':(current.accuracy>=.95?'Regiões aprendidas':'Treinando');status.className=current.accuracy>=.95?'status success':'status';}
  function renderAll(){renderMetrics();drawPlane();drawNetwork();drawHistory();renderMath();renderTable();}
  function reset(){weights=[0,0,0,0,0,0];bias=0;epoch=0;history=[];lastStep=null;viewedPoint=data[0];testPoint=null;recordHistory();renderAll();}
  document.getElementById('rbfClassTrainOne').addEventListener('click',function(){trainEpoch();renderAll();});document.getElementById('rbfClassTrainHundred').addEventListener('click',function(){for(var i=0;i<100;i++)trainEpoch();renderAll();});document.getElementById('rbfClassReset').addEventListener('click',reset);document.getElementById('rbfClassTest').addEventListener('click',function(){testPoint=[Number(document.getElementById('rbfClassTestX1').value),Number(document.getElementById('rbfClassTestX2').value)];viewedPoint=[testPoint[0],testPoint[1],0];var result=forward(testPoint);document.getElementById('rbfClassTestResult').innerHTML='u = '+number(result.u,4)+'<br>ŷ = Step(u−0,5) = <strong>classe '+(result.prediction===0?'A':'B')+'</strong>';drawPlane();drawNetwork();});
  recordHistory();renderAll();
}());
