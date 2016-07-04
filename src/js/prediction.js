$().ready(function(){

	//初始化overview
	$.get('localdata/teams_data.json', function (teamsJson) {
		initOverview(teamsJson);
	});

	//初始化下拉选择
	$(".team_choose select").html($("#template-option-teams").html());

	var chart = echarts.init(document.getElementById('chart-panel'));
	chart.setOption(pieOpt);

	$('#chart-panel').data('echart',chart);


});

function initOverview(teamsJson){
	$('#menu-overview').on('click',function(){
		$("#overview").toggle(1000);
	});
	//var $segment = $(".js-segment");
	_.each(teamsJson, function(item){
		var selector = ".js-segment-"+item.TEAM.substring(0,1).toUpperCase();
		//console.log(selector)
		$(selector).append('<li><span class="flag-wrap"><img src="images/flags/'+item.TEAM.substring(0,3).toLowerCase()+'.png" class="flag"></span><a class="text" href="detai.html?"> '+item.TEAM+'</a></li>')
	});
}

var pieOpt  = {
	backgroundColor:'rgba(255,255,255,.8)',
    tooltip : {
        trigger: 'item',
        formatter: "{a} <br/>{b} : {c} ({d}%)"
    },
    legend: {
        orient: 'vertical',
        left: 'left',
        data: ['主队胜率','平局率','客队胜率']
    },
    series : [
        {
            name: '胜率',
            type: 'pie',
            radius : '80%',
            center: ['50%', '50%'],
            data:[
                {value:335, name:'主队胜率'},
                {value:310, name:'平局率'},
                {value:234, name:'客队胜率'}
            ],
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }
    ]
};

function drawPie(data){
	$('#chart-panel').data('echart').setOption(pieOpt);
}