 /*
  * steemtech - v0.1
  *
  * https://steemit.com/@lazyrodi
  *
  */
 Number.prototype.format = function() {
     if (this == 0) {
         return 0;
     }

     var $regex = /(^[+-]?\d+)(\d{3})/;
     var $num = this + '';

     while ($regex.test($num)) {
         $num = $num.replace($regex, '$1' + ',' + '$2');
     }

     return $num;
 }

 var $sUserName = '';
 var $sMessageWarning = '';
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

 var $sSBDPerVote = '';

 //20180415 - 19:58
 var $sDataForSteemPower = {
    "steem_to_sbd": 2.632,
    "sbd_to_steem": 0.37993920972644374,
    "sbd_median_price": 2.632,
    "steem_per_mvests": 490.6390793396781,
    "vests_to_sp": 0.00049063822103829,
    "sp_to_vests": 2038.1580720105717,
    "ticker": {
        "latest": "1.08920187793427248",
        "lowest_ask": "1.08770718232044206",
        "highest_bid": "1.08208049304323461",
        "percent_change": "-1.93009911319770300",
        "steem_volume": "4680.935 STEEM",
        "sbd_volume": "5124.413 SBD"
    }
 };

 var $totalVotees = 0;
 var $sSelfVoteRatio = 0;

 var $sMaxSelfVote = 0;
 var $sMaxVotePerDay = 0;
 var $sMaxInverseSimpson = 0;
 var $sMaxRShares = 0;

 // var $sBrowserWidth = 0;
 var $sChartSizeThree = 300; // 310 230 300 380
 var $sChartSizeTwo = 420; // 310 330 420 450

 $(document).ready(function() {
     initPage();

     $("#btn_search").click(onClickBtnSearch);
 });

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

     $sSBDPerVote = $("#sbd_per_vote")
     // $sBrowserWidth = getBrowserWidth();

     if (isMobileOrTablet()) {
         $sChartSizeThree = 310;
         $sChartSizeTwo = 290;

	 // Fix Align in mobile.
         $("#segment_profile").css("padding", "1em 0em 1em 2em");
     }

     // $("#question_selfvote").popup();
     $("#question_inverse_simpson").popup();
     // $("#question_vote_per_day").popup();
     // $("#question_votee").popup();

     $("#progress_voting_power").progress({
         percent: 0
     });

     $("#input_username").keypress(function(event) {
         if (event.which == 13) { // enter
             $("#btn_search").click();
         }
     });

     $("#input_username").focus();

     // Get SP data. https://steemit.com/cn/@justyy/steem-api-steem-api-converter-sbd-steem-vests
     var requestSteemConverter = new XMLHttpRequest();
     requestSteemConverter.open('GET', 'https://happyukgo.com/api/steemit/converter/?cached');
     requestSteemConverter.send();

     requestSteemConverter.onreadystatechange = function(e) {
         if (requestSteemConverter.readyState === XMLHttpRequest.DONE) {
             if (requestSteemConverter.status === 200) {
                // update here
                 $sDataForSteemPower = JSON.parse(requestSteemConverter.responseText);
             } else {
                 console.log('error = ' + e);
             }
         }
     }
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
 }

 function onClickBtnSearch() {
     refreshPage();

     $sUserName = $("#input_username").val();

     if ($sUserName === '') {
         return;
     }

     if ($sUserName[0] == '@') {
         $sUserName = $sUserName.substring(1, $sUserName.length);
     }

     var ajaxDataGetAccountVotes = {
         "jsonrpc": "2.0",
         "id": 0,
         "method": "call",
         "params": [0, "get_account_votes", [$sUserName]]
     };

     var ajaxDataGetAccounts = {
         "jsonrpc": "2.0",
         "id": 1,
         "method": "get_accounts",
         "params": [
             [$sUserName]
         ]
     }

     var requestAccountVotes = {
         "url": "https://api.steemit.com",
         "method": "POST",
         "headers": {
             "Accept": "application/json",
             "Content-Type": "text/plain"
         },
         "data": JSON.stringify(ajaxDataGetAccountVotes),
         beforeSend: function() {
             $("#wrap_loader").addClass('active');
         },
         complete: function() {
             // loading complete.
             $("#wrap_loader").removeClass('active');
         },
         timeout: 180000
     };

     var requestGetAccounts = {
         "url": "https://api.steemit.com",
         "method": "POST",
         "headers": {
             "Accept": "application/json",
             "Content-Type": "text/plain"
         },
         "data": JSON.stringify(ajaxDataGetAccounts),
         beforeSend: function() {
             $("#container_profile").addClass('active');
         },
         complete: function() {
             // loading complete.
             $("#container_profile").removeClass('active');
         },
         timeout: 180000
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
 }

 function makeProfile(result) {
     var $profileName = result.name + " (" + calcReputation(result.reputation) + ")";
     var $imgSrc = "https://semantic-ui.com/images/avatar2/large/matthew.png";
     var $location = '-';

     if (result.json_metadata != '') {
         var $metadata = JSON.parse(result.json_metadata);

         if ($metadata.profile != '') {
             if ($metadata.profile.name != undefined) {
                 $profileName = $metadata.profile.name + " (" + calcReputation(result.reputation) + ")";
             }
             if ($metadata.profile.profile_image != undefined) {
                 //$imgSrc = $metadata.profile.profile_image;
                 $imgSrc = "https://steemitimages.com/u/" + result.name + "/avatar"
             }
             if ($metadata.profile.location != undefined) {
                 $location = $metadata.profile.location;
             }
         }
     }

     var $profiles = "<span style='font-size:0.9em;'><a href='https://steemit.com/@" +
         result.name +
         "' target='_blank'>@" + result.name +
         "</a><br><i class='pencil alternate icon'></i>" +
         result.post_count.format() +
         " posts" +
         "<br><i class='map marker alternate icon'></i>" +         
         $location +
         "<br><i class='calendar alternate outline icon'></i>" +
         result.created.split('T')[0] +
         "</span>";

     var $vest = result.vesting_shares.split(' ')[0];
     var $received_vest = result.received_vesting_shares.split(' ')[0];
     var $delegated_vest = result.delegated_vesting_shares.split(' ')[0];
     var $sum_vest = parseFloat($vest) + parseFloat($received_vest) - parseFloat($delegated_vest);
     var $mvest = ($sum_vest / 1000000).toFixed(2);
     var $currentSP = parseInt(getSteemPower($sum_vest));

     $("#profile_name").text($profileName);
     $("#profile_img").attr('src', $imgSrc);
     $("#profile_profiles").html($profiles);
     $("#value_mvest").text(parseInt($mvest).format());
     $("#value_sp").text($currentSP.format());
     $("#value_delegated").text(parseInt(getSteemPower($delegated_vest)).format());
     $("#value_received").text(parseInt(getSteemPower($received_vest)).format());

     var $currentVp = getVotingPower(result.voting_power, result.last_vote_time);

     $("#progress_voting_power").progress({
         percent: $currentVp
     });

     setFullVoteSBD($currentSP);
 }

 // https://steemit.com/steemit/@hmushtaq/how-to-calculate-steem-power-from-vests
 // https://steemit.com/cn/@justyy/steem-api-steem-api-converter-sbd-steem-vests
 function getSteemPower(vest) {
     var $mySP = Math.round(parseFloat(vest / $sDataForSteemPower.sp_to_vests));

     return $mySP; // == 0 ? 15 : $mySP;
 }

 // https://steemit.com/bisteemit/@paulag/how-to-calculate-the-worth-of-any-steemit-vote-steemit-business-intelligence
 // https://steemnow.com/upvotecalc.html
 function setFullVoteSBD(sp) {

    var curSP = sp;

    function e() {

        var e = curSP,
            t = 100,
            n = 100,
            r = e / a,
            m = parseInt(100 * t * (100 * n) / p);
        m = parseInt((m + 49) / 50);
        var l = parseInt(r * m * 100) * i * o;
        $("#sbd_per_vote").text(l.toFixed(2)), $("#sbd_per_vote").hide().fadeIn("fast")
    }

    function t() {
        steem.api.getRewardFund("post", function(e, t) {
            n = t.reward_balance, r = t.recent_claims, i = n.replace(" STEEM", "") / r
        }), steem.api.getCurrentMedianHistoryPrice(function(e, t) {
            o = t.base.replace(" SBD", "") / t.quote.replace(" STEEM", "")
        }), setTimeout(t, 1e4)
    }
    var a, n, r, i, o, p = 1e4;
    steem.api.setOptions({
        url: "https://api.steemit.com"
    }), t();
    var m = setInterval(function() {
        void 0 !== o && (clearInterval(m), steem.api.getDynamicGlobalProperties(function(t, n) {
            a = n.total_vesting_fund_steem.replace(" STEEM", "") / n.total_vesting_shares.replace(" VESTS", ""), e()
        }))
    }, 200);

    e();
 }

 // https://steemit.com/kr-dev/@maanya/steem-python
 function getVotingPower(vp, lastTime) {
     var $lastTimeMillis = new Date(lastTime).getTime();
     var $timeZoneMillis = (new Date().getTimezoneOffset()) * 60 * 1000;
     var $nowTimeMillis = new Date().getTime();

     var $diff = ($nowTimeMillis - $lastTimeMillis + $timeZoneMillis) / 1000; //to second

     var $vpCorrection = $diff * (2000 / (3600 * 24));

     var $finalVP = ((vp + $vpCorrection) / 100).toFixed(2);
     if ($finalVP > 100) {
         $finalVP = 100;
     }

     return $finalVP;
 }

 // https://steemit.com/steemit/@digitalnotvir/how-reputation-scores-are-calculated-the-details-explained-with-simple-math
 function calcReputation(rep) {
     var ret = Math.log(rep) / Math.log(10); // same as 'Math.log10(rep) [I.E. doesn't support Math.log10]
     if (isNaN(ret)) {
         ret = 0;
     }
     ret = Math.max(ret - 9, 0);
     ret = Math.abs(ret) * 9 + 25

     return parseInt(ret);
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
     $jsonVotees[$sUserName] = {
         "count": 0,
         "rshares": 0,
         "weight": 0
     };

     for (var i = 0; i < res.length; i++) {
         var $date = new Date(Date.parse(res[i].time));

         if ($dayBefore < $date && $date < $sToday) {
             var $votee = parseUserId(res[i].authorperm);

             if ($votees.indexOf($votee) == -1) {
                 $votees.push($votee);
                 $jsonVotees[$votee] = {
                     "count": 0,
                     "rshares": 0,
                     "weight": 0
                 };
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
             var $tempVoteRate = ($personalRShares / $allRShares * 100).toFixed(2);
             var $tempRShares = ($personalRShares / 1000000000).toFixed(2);

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
             width: $sChartSizeThree
         },
         padding: {
             top: 10,
             right: 35,
             bottom: 10,
             left: 25
         },
         data: {
             columns: [$sDataForChartSelfVote, $sDataForChartVotePerDay],
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
             width: $sChartSizeThree
         },
         padding: {
             top: 10,
             right: 20,
             bottom: 10,
             left: 25
         },
         data: {
             columns: [$sDataForChartInverseSimpson]
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
             width: $sChartSizeTwo
         },
         data: {
             columns: $sDataForChartVoteeDonut,
             type: "donut",
             onclick: function(d, i) {
                 if (!isMobileOrTablet()) {
                     window.open('https://steemit.com/@' + d.id);
                 }
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

     var chart_votee_rshares = bb.generate({
         size: {
             height: 350,
             width: $sChartSizeTwo
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
     switch (num_days) {
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

 /**
  * get current browser's width.
  *
  * @return Browser's width.
  **/
 function getBrowserWidth() {
     if (typeof(window.innerWidth) == 'number') {
         return window.innerWidth;
     } else if (document.documentElement &&
         document.documentElement.clientWidth) {
         return document.documentElement.clientWidth;
     } else if (document.body && document.body.clientWidth) {
         return document.body.clientWidth;
     }
     return -1;
 }

 /**
  * Check the device is mobile or not.
  *
  * @return true (mobile or tablet) or false (PC)
  **/
 // https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
 function isMobileOrTablet() {
     var check = false;
     (function(a) {
         if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
             check = true;
     })(navigator.userAgent || navigator.vendor || window.opera);
     return check;
 };