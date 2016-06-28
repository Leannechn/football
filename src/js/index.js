$().ready(function(){
	var worldMap = echarts.init(document.getElementById('world-map'));
	option = {
	    title: {
	        text: 'World Population (2010)',
	        subtext: 'from United Nations, Total population, both sexes combined, as of 1 July (thousands)',
	        sublink: 'http://esa.un.org/wpp/Excel-Data/population.htm',
	        left: 'center',
	        top: 'top'
	    },
	   /* tooltip: {
	        trigger: 'item',
	        formatter: function (params) {
	            var value = (params.value + '').split('.');
	            value = value[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,')
	                    + '.' + value[1];
	            return params.seriesName + '<br/>' + params.name + ' : ' + value;
	        }
	    },*/
	    toolbox: {
	        show: true,
	        orient: 'vertical',
	        left: 'right',
	        top: 'center',
	        feature: {
	            dataView: {readOnly: false},
	            restore: {},
	            saveAsImage: {}
	        }
	    },
	    series: [
	        {
	            name: 'World Population (2010)',
	            type: 'map',
	            mapType: 'world',
	            roam: true,
	            label:{
	            	normal:{
	            		show:true,
	            		textStyle:{
	            			color:'#31BBB1'
	            		}
	            	}
	            },
	            itemStyle:{
	            	color:'#23F3BD',
	                emphasis:{label:{show:true}}
	            },
	            data:[]
	        }
	    ]
	};

	$.get('assets/echarts/world.json', function (worldJson) {
		//绘制地图
		echarts.registerMap('world', worldJson);


		$.get('localdata/teams_flag.json', function (teamsJson) {
			
		   	option.series[0].label.normal.formatter = function(params){
		   		var team = _.find(teamsJson, function(item){
		   			return params.name === item.name;
		   		});
		   		console.log(team);
		   		return !!team? team['name']:' ';
		   	}

			worldMap.setOption(option);

			drawTable(teamsJson);
		});
	});

	
});


function drawTable(teamsJson){
	//初始化表格

	$("#team-table").DataTable({
		columnDefs:[{
					render:function(data){
						//图标转换
						var team = _.find(teamsJson, function(t){
							return t.name.toUpperCase() == data;
						});
						return team? '<span class="flag-wrap"><img src="images/flags/'+team.icon+'.png" class="flag"></span><a href="/worldfootball/statisticsandrecords/players/player=76824/index.html" class="text"> '+data+'</a>':data;
					},
					targets:0
				}]
	});
}




