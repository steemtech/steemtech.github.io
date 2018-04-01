 /*
  * steemtech - v0.1
  *
  * https://steemit.com/@lazyrodi
  *
 */

var $sUserName = '';
var $ssMessageWarning = '';
var $sMessageWarningHeader = '';
var $sChartAreaSelfVote = '';
var $sChartAreaInverseSimpson = '';
var $sChartAreaVotePerDay = '';
var $sChartAreaVoteeDonut = '';
var $sChartAreaVoteeRShares = '';

var $sToday;

var $sDataForChartSelfVote = [];
var $sDataForChartVotePerDay = [];
var $sDataForChartInverseSimpson = [];
var $sDataForChartVoteeDonut = [];
var $sDataForChartVoteeRShares = [];
var $sDataForChartVoteeRSharesVotees = [];

var $totalVotees = 0;
var $sSelfVoteRatio = 0;

var $sMaxSelfVote = 0;
var $sMaxVotePerDay = 0;
var $sMaxInverseSimpson = 0;
var $sMaxRShares = 0;

$(document).ready(function() {
    initPage();

    $("#btn_search").click(function() {
        refreshPage();

        $sUserName = $("#input_username").val();

        if ($sUserName === '') {
            return;
        }

        if ($sUserName[0] == '@') {
            $sUserName = $sUserName.substring(1,$sUserName.length);
        }

        var ajaxDataGetAccountVotes = {
            "jsonrpc" : "2.0",
            "id" : 0,
            "method" : "call",
            "params" : [0, "get_account_votes", [$sUserName]]
        };

        var ajaxDataGetAccounts = {
            "jsonrpc" : "2.0",
            "id" : 1,
            "method" : "get_accounts",
            "params" : [[$sUserName]]
        }

        var requestAccountVotes = {
            "url" : "https://api.steemit.com",
            "method" : "POST",
            "headers" : {
                "Accept" : "application/json",
                "Content-Type" : "text/plain"
            },
            "data" : JSON.stringify(ajaxDataGetAccountVotes),
            beforeSend:function() {
                $("#wrap_loader").addClass('active');
            },
            complete:function() {
                // loading complete.
                $("#wrap_loader").removeClass('active');
            },
            timeout:180000
        };

        var requestGetAccounts = {
            "url" : "https://api.steemit.com",
            "method" : "POST",
            "headers" : {
                "Accept" : "application/json",
                "Content-Type" : "text/plain"
            },
            "data" : JSON.stringify(ajaxDataGetAccounts),
            beforeSend:function() {
                $("#container_profile").addClass('active');
            },
            complete:function() {
                // loading complete.
                $("#container_profile").removeClass('active');
            },
            timeout:180000
        };

        $.ajax(requestAccountVotes).done(function(response) {
            // loading complete. cross-check.
            $("#wrap_loader").removeClass('active');

            calc(response.result, 90);
            calc(response.result, 60);
            calc(response.result, 30);
            calc(response.result, 14);
            calc(response.result, 7);

            drawCharts();

        }).fail(function(jqXHR, status) {
            console.log("status = " + status);
            $sMessageWarningHeader.text(status);
            $sMessageWarning.removeClass("display-none");
        });

        $.ajax(requestGetAccounts).done(function(response) {
            // loading complete. cross-check.
            $("#container_profile").removeClass('active');

            makeProfile(response.result[0]);

        }).fail(function(jqXHR, status) {
            console.log("status = " + status);
            $sMessageWarningHeader.text(status);
            $sMessageWarning.removeClass("display-none");
        });
    });

});

function makeProfile(result) {
    
    var $profileName = result.name + " (" + calcReputation(result.reputation) + ")";
    var $imgSrc = "https://semantic-ui.com/images/avatar2/large/matthew.png";
    var $profiles = "<a href='https://steemit.com/@" + result.name + "' target='_blank'>@" + result.name + '</a><br>' + result.post_count + " posts";

    if (result.json_metadata != '') {
        var $metadata = JSON.parse(result.json_metadata);

        if ($metadata.profile != '') {
            if ($metadata.profile.name != undefined) {
                $profileName = $metadata.profile.name + " (" + calcReputation(result.reputation) + ")";        
            }
            if ($metadata.profile.profile_image != undefined) {
                $imgSrc = $metadata.profile.profile_image;                    
            }
        }
    }

    $("#profile_name").text($profileName);
    $("#profile_img").attr('src', $imgSrc);
    $("#profile_profiles").html($profiles);
    var $temp = result.vesting_shares.split(' ')[0];
    $("#value_mvest").text((parseFloat($temp)/1000000).toFixed(2));

    setVotingPower(result.voting_power, result.last_vote_time);

}

// https://steemit.com/steemit/@hmushtaq/how-to-calculate-steem-power-from-vests
function calcSteemPower(vest) {

}

// https://steemit.com/kr-dev/@maanya/steem-python
function setVotingPower(vp, lastTime) {
    var $lastTimeMillis = new Date(lastTime).getTime();
    var $timeZoneMillis = (new Date().getTimezoneOffset()) * 60 * 1000;
    var $nowTimeMillis = new Date().getTime();

    var $diff = ($nowTimeMillis - $lastTimeMillis + $timeZoneMillis) / 1000; //to second

    var $vpCorrection = $diff * (2000 / (3600 * 24));

    $("#progress_voting_power").progress({
        percent: ((vp + $vpCorrection)/100).toFixed(2)
    });

}

// https://steemit.com/steemit/@digitalnotvir/how-reputation-scores-are-calculated-the-details-explained-with-simple-math
function calcReputation(rep) {
    var ret = Math.log(rep)/Math.log(10); // same as 'Math.log10(rep) [I.E. doesn't support Math.log10]
    if (isNaN(ret)) {
        ret = 0;
    }
    ret = Math.max(ret - 9, 0);
    ret = Math.abs(ret) * 9 + 25

    return parseInt(ret);
}

function initPage() {
    $sMessageWarning = $("#message_warning");
    $sMessageWarningHeader = $("#message_warning_header");
    $sChartAreaSelfVote = $("#chart_area_selfvote");
    $sChartAreaInverseSimpson = $("#chart_area_inverse_simpson");
    $sChartAreaVotePerDay = $("#chart_area_vote_per_day");
    $sChartAreaVoteeDonut = $("#chart_area_votee_donut");
    $sChartAreaVoteeRShares = $("#chart_area_votee_rshares");

    $sContainerSelfVote = $("#container_selfvote");
    $sContainerRShares = $("#container_rshares");
    $sContainerInverseSimpson = $("#container_inverse_simpson");

    $sToday = new Date();

    // $("#question_selfvote").popup();
    $("#question_inverse_simpson").popup();
    // $("#question_vote_per_day").popup();
    // $("#question_votee").popup();

    $("#input_username").keypress(function(event) {
        if (event.which == 13) { // enter
            $("#btn_search").click();
        }
    });
}

function refreshPage() {
    $sMessageWarning.addClass("display-none");
    $sMessageWarningHeader.empty();

    $sChartAreaSelfVote.empty();
    $sChartAreaInverseSimpson.empty();
    $sChartAreaVotePerDay.empty();
    $sChartAreaVoteeDonut.empty();
    $sChartAreaVoteeRShares.empty();

    $sDataForChartSelfVote = ["Selfvote Rate"];
    $sDataForChartVotePerDay = ["Vote per Day"];
    $sDataForChartInverseSimpson = ["Vote Diversity"];
    $sDataForChartVoteeRShares = ["RShares"];
    $sDataForChartVoteeDonut = [];
    $sDataForChartVoteeRSharesVotees = [];

    $totalVotees = 0;
    $sSelfVoteRatio = 0;

    $sMaxSelfVote = 0;
    $sMaxVotePerDay = 0;
    $sMaxInverseSimpson = 0;
    $sMaxRShares = 0;

    // $sDataForChartSelfVote.push("Selfvote Rate");
    // $sDataForChartVotePerDay.push("Vote per Day");
    // $sDataForChartInverseSimpson.push("Vote Diversity");
    // $sDataForChartVoteeRShares.push("RShares");
}

/**
 * Main calculation. I can't explain this function. sorry~
 *
 * @param res : Result array from response of $ajax data.
 * @param num_days : Wants to know the data from "num_days" ago to today.
 **/
function calc(res, num_days) {
    var $votees = [];
    var $jsonVotees = new Object();

    var $allRShares = 0;
    var $allVWeight = 0;
    var $sumOfShareSquared = 0;

    var $dayBefore = getDayBefore(num_days);

    // init for selfvote
    $jsonVotees[$sUserName] = {"count":0, "rshares":0, "weight":0};

    for (var i = 0; i < res.length; i++) {
        var $date = new Date(Date.parse(res[i].time));

        if ($dayBefore < $date && $date < $sToday) {
            var $votee = parseUserId(res[i].authorperm);

            if ($votees.indexOf($votee) == -1) {
                $votees.push($votee);
                $jsonVotees[$votee] = {"count":0, "rshares":0, "weight":0};
            }

            $allRShares += parseFloat(res[i].rshares);
            $allVWeight += parseFloat(res[i].percent);

            $jsonVotees[$votee].count++; // count vote
            $jsonVotees[$votee].rshares += parseFloat(res[i].rshares);
            $jsonVotees[$votee].weight += parseFloat(res[i].percent);
        }
    }

    for (var j = 0; j < $votees.length; j++) {
        $sumOfShareSquared += parseFloat(Math.pow(($jsonVotees[$votees[j]].rshares / $allRShares), 2));
    }

    var $inverseSimpson = parseFloat(1.0 / $sumOfShareSquared).toFixed(2);
    var $selfVote = $jsonVotees[$sUserName].rshares / $allRShares * 100;
    var $votePerDay = $allVWeight / 10000 / num_days;

    if (num_days == 90) {

        $votees.sort(function(a, b) {
            if ($jsonVotees[a].rshares == $jsonVotees[b].rshares) {
                return 0;
            }
            return $jsonVotees[a].rshares < $jsonVotees[b].rshares ? 1 : -1;
        });

        var $others = 100;

        $totalVotees = $votees.length;

        for (var k = 0; k < 9; k++) {
            var $personalRShares = $jsonVotees[$votees[k]].rshares;
            var $tempVoteRate = ($personalRShares/$allRShares*100).toFixed(2);
            var $tempRShares = ($personalRShares/1000000000).toFixed(2);

            if ($votees[k] == $sUserName) {
                $sSelfVoteRatio = $tempVoteRate;
            }

            if ($sMaxRShares < $tempRShares) {
                $sMaxRShares = Math.round($tempRShares) + 100;
            }
            $others -= $tempVoteRate;
            $sDataForChartVoteeDonut.push([$votees[k], $tempVoteRate]);
            $sDataForChartVoteeRSharesVotees.push($votees[k]);
            $sDataForChartVoteeRShares.push($tempRShares);
        }

        $sDataForChartVoteeDonut.push(["others", $others]);
    }

    /* 90 > 60 > 30 > 14 > 7 days */
    $sDataForChartInverseSimpson.push($inverseSimpson);
    $sDataForChartSelfVote.push($selfVote.toFixed(2));
    $sDataForChartVotePerDay.push($votePerDay.toFixed(2));

    if ($sMaxSelfVote < $selfVote) {
        $sMaxSelfVote = Math.round($selfVote) + 10;
    }
    if ($sMaxVotePerDay < $votePerDay) {
        $sMaxVotePerDay = Math.round($votePerDay) + 10;
    }
    if ($sMaxInverseSimpson < $inverseSimpson) {
        $sMaxInverseSimpson = Math.round($inverseSimpson) + 10;
    }
}

function drawCharts() {
    var chart_selfvote = bb.generate({
        size: {
            height: 300,
            width: 380
        },
        padding: {
            top: 10,
            right: 35,
            bottom: 10,
            left: 25
        },
        data: {
            columns : [$sDataForChartSelfVote, $sDataForChartVotePerDay],
            axes: {
                "Vote per Day": "y2"
            }
        },
        axis: {
            x: {
                type: "category",
                categories: [
                "90 days",
                "60 days",
                "30 days",
                "14 days",
                "7 days"
                ]
            },
            y: {
                label: "( % )",
                max: $sMaxSelfVote,
                min: 0
            },
            y2: {
                show: true,
                label: "( Count )",
                max: $sMaxVotePerDay,
                min: 0
            }
        },
        bindto: "#chart_area_selfvote"
    });

    var chart_inverse_simpson = bb.generate({
        size: {
            height: 300,
            width: 380
        },
        padding: {
            top: 10,
            right: 20,
            bottom: 10,
            left: 25
        },
        data: {
            columns : [$sDataForChartInverseSimpson]
        },
        axis: {
            x: {
                type: "category",
                categories: [
                "90 days",
                "60 days",
                "30 days",
                "14 days",
                "7 days"
                ]
            },
            y: {
                label: "( Count )",
                max: $sMaxInverseSimpson,
                min: 0
            }
        },
        bindto: "#chart_area_inverse_simpson"
    });

    var chart_votee_donut = bb.generate({
        size: {
            height: 350,
            width: 350
        },
        data: {
            columns: $sDataForChartVoteeDonut,
        type: "donut",
        onclick: function(d, i) {
        window.open('https://steemit.com/@' + d.id);
        },
        onover: function(d, i) {
          // do nothing
        },
        onout: function(d, i) {
          // do nothing
        }
      },
      legend: {
        show: false
      },
      donut: {
        title: "Total Votees = " + $totalVotees + "\nSelf votes = " + $sSelfVoteRatio + " %",
        padAngle: 0.02,
        label: {
            format: function(value, ratio, id) {
                return id;
            }
        }
      },
      bindto: "#chart_area_votee_donut"
    });

    var chart = bb.generate({
      size: {
        height: 350,
        width: 530
      },
      data: {
        columns: [$sDataForChartVoteeRShares],
        type: "bar"
      },
      bar: {
        width: {
          ratio: 0.7
        }
      },
      axis: {
          x: {
              type: "category",
              categories: $sDataForChartVoteeRSharesVotees
          },
          y: {
              label: "( Billion )",
              max: $sMaxRShares,
              min: 0
          }
      },

      bindto: "#chart_area_votee_rshares"
    });
}

/**
 * Get author name from author permalink.
 *
 * @param authorperm : full author permalink
 * @return author
 **/
function parseUserId(authorperm) {
  return authorperm.split('/')[0];
}

/**
 * Get date before num_days from today.
 *
 * @param num_days : Number of days before from today.
 * @return Date before num_days from today.
 **/
function getDayBefore(num_days) {
    switch(num_days) {
        case 7:
            return new Date(Date.parse($sToday) - 7 * 1000 * 60 * 60 * 24);
        case 14:
            return new Date(Date.parse($sToday) - 14 * 1000 * 60 * 60 * 24);
        case 30:
            return new Date(Date.parse($sToday) - 30 * 1000 * 60 * 60 * 24);
        case 60:
            return new Date(Date.parse($sToday) - 60 * 1000 * 60 * 60 * 24);
        case 90:
            return new Date(Date.parse($sToday) - 90 * 1000 * 60 * 60 * 24);
    }
    return new Date(); // return today. just defend exception.
}