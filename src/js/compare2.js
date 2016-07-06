//全局数据
var teamData = [],
	matchesdata = [];

$().ready(function(){

	$.get('localdata/teams_flag.json', function (teamsJson) {
		teamData = teamsJson;
		//初始化overview
		initOverview(teamsJson);
		//初始化下拉选择
		initSelector($(".team_choose select"),teamsJson);
	});

	$.get('localdata/matchesdata.json',function(data){
		matchesdata = data;
		if ($(".team_choose select").filter(function(d){return $(this).val() == 'none'}).length == 0) {
			refreshTable();
		}
	});

	//选择不重复
	$(".team_choose select").on('change',function(d){
		var $this =  $(this);
		var val = $this.val();

		if (val != 'none' && $(".team_choose select").filter(function(d){return $(this).val() == val}).length >1) {
			//console.log(false);
			alert('球队选择重复！')
			$this.val('none');
			setTeamBox($this.closest('.team-box'),false,'重新选择球队');
		}else if(val != 'none'){
			var team = _.find(teamData, function(t){
				return t.team === val;
			});
			setTeamBox($this.closest('.team-box'),team.icon,team.team);
		}else{
			setTeamBox($this.closest('.team-box'),false,'选择球队');
		}

		//两边都有选中的时候
		if ($(".team_choose select").filter(function(d){return $(this).val() == 'none'}).length == 0) {
			if (matchesdata.length) {
				refreshTable();
			}else{
				alert('数据加载中，请稍后！');
			}
		}
	});
	//初始化表格
	$('#datatable').DataTable({
		data:[],
		dom:'<T>',
		processing:false,
		columns:[
			{title:'EDITION',data:'EDITION'},
			{title:'DATE',data:'DATE'},
			{title:'TEAM1 GOALS',data:'T1G'},
			{title:'TEAM2 GOALS',data:'T2G'}
		]
	});
});

function setTeamBox($teambox,img,name){
	if (img) {
		$teambox.find('.team-flag').show();
		$teambox.find('.team-flag').attr('src','images/flags/'+img);
	}else{
		$teambox.find('.team-flag').hide();
	}

	$teambox.find('.team-name').text(name);
	
}

function refreshTable(){
	var teamName1 = $(".zd select").val().toUpperCase();
	var teamName2 = $(".kd select").val().toUpperCase();
	var dt = $('#datatable').DataTable();
	dt.clear();
	var arr = _.filter(matchesdata,function(item){
		isok = false;
		if ((item.TEAM1 == teamName1 && item.TEAM2 == teamName2)) {
			isok = true;
		}
		if ((item.TEAM1 == teamName2 && item.TEAM2 == teamName1)) {
			isok = true;
			var tg = item.T1G;
			item.T1G =  item.T2G;
			item.T2G = tg;
		}
		return isok;
	});

	
	if (!arr.length) {
		alert('查无数据！');
	}
	dt.rows.add(arr).draw()
}
