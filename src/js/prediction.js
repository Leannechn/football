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
                        var tg = item.T1G;
                        item.T1G =  item.T2G;
                        item.T2G = tg;
                    }
                    return isok;
                });
                resetStatic(arr);
                drawPie(arr);
                prediction(teamName1,teamName2,arr);
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


function prediction(team1,team2,data){
    var x = -7,y = 7;
    var t1 = _.find(teams, function(item){
        return item.TEAM ===team1;
    });
    var t2 = _.find(teams, function(item){
        return item.TEAM ===team2;
    });

    var di = t1.getNumerical()-t2.getNumerical();

    var pw = pd = pl = 0;

    var wn = dn = ln = 0;//在符合di区域中的赢平输次数
    var diteam = [];
    //分三类
    if (di<=x) {
        //积分差同一分类的队伍
        diteam = _.filter(teams, function(it){
            return it.TEAM != team1 && (t1.getNumerical()-it.getNumerical()) <= x;
        });
    }else if(di>x && di<y){
        //积分差同一分类的队伍
        diteam = _.filter(teams, function(it){
            var ddi = t1.getNumerical()-it.getNumerical();
            return it.TEAM != team1 &&  ddi > x && ddi<y;
        });
    }else{
        //积分差同一分类的队伍
        diteam = _.filter(teams, function(it){
            return it.TEAM != team1 && (t1.getNumerical()-it.getNumerical()) > y;
        });

    }
    //过滤在此范围（diteam）内的比赛 并计算w l d次数。
    var arr = _.filter(matchesdata, function(it){
            var isReturn = false;
            if(it.TEAM1 === team1 && _.find(diteam, function(d){
                return d.TEAM === it.TEAM2;
            })){
                isReturn = true;
                if (it.T1G > it.T2G) {
                    wn++;
                }else if(it.T1G === it.T2G){
                    dn++;
                }else{ln++;}
            }else if(it.TEAM2 === team1 && _.find(diteam, function(d){
                return d.TEAM === it.TEAM1;
            })){
                isReturn = true;
                if (it.T1G > it.T2G) {
                    ln++;
                }else if(it.T1G === it.T2G){
                    dn++;
                }else{wn++;}
            }
            return isReturn;
    });
    var allnum = arr.length;

    var pwe = percentage(wn,allnum); //预测概率
    var pde = percentage(dn,allnum);
    var ple = percentage(ln,allnum);

    $('#g1-goals').text(pwe);
    $('#p-goals').text(pde);
    $('#g2-goals').text(ple);
    //重绘饼图
    drawPie(wn,dn,ln);

}