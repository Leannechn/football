var matchesdata = [];//全局变量缓存数据
var teamData = [];
$().ready(function(){

	

	$.get('localdata/matchesdata.json',function(data){
        matchesdata = data;
        //缓存预处理数据
        window.teams = fnStatistic(matchesdata);

        $.get('localdata/teams_flag.json', function (teamsJson) {
            teamData = teamsJson;
            //初始化overview
            initOverview(teamsJson);
            //初始化下拉选择
            initSelector($(".team_choose select"),teamsJson);
        });
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
                var teamName1 = $(".zd select").val().toUpperCase();
                var teamName2 = $(".kd select").val().toUpperCase();
                var arr = _.filter(matchesdata,function(item){
                    isok = false;
                    if ((item.TEAM1 == teamName1 && item.TEAM2 == teamName2)) {
                        isok = true;
                    }
                    if ((item.TEAM1 == teamName2 && item.TEAM2 == teamName1)) {
                        isok = true;
                    }
                    return isok;
                });
                if (!arr.length) {alert('这两支队伍无历史比赛数据');}
                prediction(teamName1,teamName2);
            }else{
                alert('数据加载中，请稍后！');
            }
        }
    });

	var chart = echarts.init(document.getElementById('chart-panel'));
	chart.setOption(pieOpt);

	$('#chart-panel').data('echart',chart);


});

var pieOpt  = {
	backgroundColor:'rgba(255,255,255,.8)',
    tooltip : {
        trigger: 'item',
        formatter: "{a} <br/>{b} : ({d}%)"
    },
    legend: {
        orient: 'vertical',
        left: 'left',
        data: ['主队胜率','平局率','客队胜率']
    },
    series : [
        {
            name: '预测',
            type: 'pie',
            radius : '80%',
            center: ['50%', '50%'],
            data:[
                {value:335, name:'无数据'}
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

function resetStatic(arr){
    
    if (arr.length) {
       var p = g1 = g2 = 0;
        _.each(arr, function(it){
            if (it.T1G == it.T2G) {p++;}
            else if (it.T1G > it.T2G) {g1++;}
            else{g2++;}
        });
        var n = p+g1+g2; 
        $('#g1-goals').text(percentage(g1,n));
        $('#p-goals').text(percentage(p,n));
        $('#g2-goals').text(percentage(g2,n));
    }else{
        alert('这两支队伍无历史比赛数据')
        $('#g1-goals').text('0%');
        $('#p-goals').text('0%');
        $('#g2-goals').text('0%');
    }
    
}

function setTeamBox($teambox,img,name){
    if (img) {
        $teambox.find('.team-flag').show();
        $teambox.find('.team-flag').attr('src','images/flags/'+img);
    }else{
        $teambox.find('.team-flag').hide();
    }

    $teambox.find('.team-name').text(name);
    
}



function drawPie(wn,dn,ln){
    pieOpt.series[0].data = [
        {value:dn,name:'平局'},
        {value:wn,name:'队1赢'},
        {value:ln,name:'队2赢'}
    ];
	$('#chart-panel').data('echart').setOption(pieOpt);
}


function percentage(num, total) { 
    return (Math.round(num / total * 10000) / 100.00 + "%");// 小数点后两位百分比
   
}

function fnStatistic(matchesdata){
    //预统计
    var teamArr = _.union(_.map(matchesdata,'TEAM1'), _.map(matchesdata,'TEAM2'));
    
    var teams = _.map(teamArr, function(value){
        return{
            TEAM:value,
            W_num:0,
            D_num:0,
            L_num:0,
            getNumerical:function() {
               return this.W_num*3 + this.D_num*1 + this.L_num*0;
            },
            getP:function(arg){
                var result = 0;
                var sun = this.W_num+this.D_num+this.L_num;
                return percentage(this[arg+'_num'],sun);
            }
        };
    });
    
    //求出积分
    _.each(matchesdata, function(item){
        var t1 = _.find(teams, function(v){
            return v.TEAM === item.TEAM1;
        });
        var t2 = _.find(teams, function(v){
            return v.TEAM === item.TEAM2;
        });
        if (!t1) {console.log(item)}
            if (!t2) {console.log(item)}
        if (item.T1G > item.T2G) {
            //队1胜 队2输
            t1.W_num++;
            t2.L_num++;
                
        }if (item.T1G == item.T2G) {
            //队1胜 队2输
            t1.D_num++;
            t2.D_num++;
        }else{
            //队1输 队2胜
            t2.W_num++;
            t1.L_num++;
        }
    });
    return teams; 
}

function getNumIndedx(d1,d2){
    //积分差属于哪个区间
    var x = -7,y = 7;
    var di = d1-d2;
    if (di<=x) {
        return 0;
    }else if(di>x && di<y){
        return 1;
    }else{
        return 2;
    }
}


function prediction(team1,team2,data){
    var x = -7,y = 7;
    var t1 = _.find(teams, function(item){
        return item.TEAM ===team1;
    });
    var t2 = _.find(teams, function(item){
        return item.TEAM ===team2;
    });

    var di = t1.getNumerical()-t2.getNumerical(); //被选中的两个队伍的积分差

    //var pw = pd = pl = 0;
    var compare_num = [[0,0,0],[0,0,0],[0,0,0]];//[W,D,L][区间1，区间2，区间3],二维矩阵

    var arr = _.filter(matchesdata,function(item){
        return item.TEAM1 == team1 || item.TEAM2 == team1;
    });
    _.each(arr, function(item){
        var ta = _.find(teams, function(v){
            return v.TEAM === item.TEAM1;
        }).getNumerical();
        var tb = _.find(teams, function(v){
            return v.TEAM === item.TEAM2;
        }).getNumerical();

        if (item.T1G > item.T2G) {
            //队1胜 队x输:队x胜 队1输:
            compare_num[item.TEAM1 == team1? 0:2][getNumIndedx(ta,tb)]++;
            
                
        }if (item.T1G == item.T2G) {
            //队1胜 队x输
            compare_num[1][getNumIndedx(ta,tb)]++;
            
        }else{
            //队1输 队x胜
            compare_num[item.TEAM1 == team1? 2:0][getNumIndedx(ta,tb)]++;
            
        }
    });

    console.log(compare_num);

    var wn = _.sum(compare_num[0]);//赢的所有场次数
    var dn = _.sum(compare_num[1]);//平的所有场次数
    var ln = _.sum(compare_num[2]);//输的所有场次数

    var wn1 = compare_num[0][0];//赢的区间区间1
    var wn2 = compare_num[0][1];//赢的区间区间2
    var wn3 = compare_num[0][2];//赢的区间区间3

    var dn1 = compare_num[1][0];//平的区间区间1
    var dn2 = compare_num[1][1];//平的区间区间2
    var dn3 = compare_num[1][2];//平的区间区间3

    var ln1 = compare_num[2][0];//输的区间区间1
    var ln2 = compare_num[2][1];//输的区间区间2
    var ln3 = compare_num[2][2];//输的区间区间3

    var allnum = arr.length; //比赛的所有场次

    //对应区间的比赛场次索引[0,1,2]
    var index = getNumIndedx(t1.getNumerical(),t2.getNumerical());//二维数组中的第二个维度区间的下标。
    var wnS = compare_num[0][index];//对应区间赢的所有场次数
    var dnS = compare_num[1][index];//对应区间平的所有场次数
    var lnS = compare_num[2][index];//对应区间输的所有场次数

    var pwe = percentage(wnS,allnum); //预测概率
    var pde = percentage(dnS,allnum);
    var ple = percentage(lnS,allnum);

    //percentage求百分比

    $('#g1-goals').text(pwe);
    $('#p-goals').text(pde);
    $('#g2-goals').text(ple);
    //重绘饼图
    drawPie(wn,dn,ln);

}