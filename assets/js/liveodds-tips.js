jQuery(function ($) {
  $(".js-odds-tips-wrapper").each(function (_, element) {
    normalizeServerRenderedSlick(element);
    removeExpiredTips(element);

    $(element).slick({
      infinite: false,
      variableWidth: false,
      swipeToSlide: true,
      touchThreshold: 200,
      speed: 200,
      useTransform: false,
      slidesToShow: 1.08,
      mobileFirst: true,
      dots: true,
      prevArrow: $(element).closest(".js-odds-tips").find(".js-prev"),
      nextArrow: $(element).closest(".js-odds-tips").find(".js-next"),
      responsive: [
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 2.08
          }
        },
        {
          breakpoint: 1209,
          settings: {
            slidesToShow: 3
          }
        }
      ]
    });
  });

  $(document).on("keyup touchend", function () {
    $(".js-odds-tips-wrapper").each(function () {
      if ($(this).hasClass("slick-initialized")) {
        $(this).slick("setPosition");
      }
    });
  });

  $(".tip-event-date time").each(function () {
    var utcDateStr = $(this).attr("datetime");
    if (!utcDateStr) {
      return;
    }

    if (!utcDateStr.includes("T")) {
      utcDateStr = utcDateStr.replace(" ", "T");
    }

    if (!/Z$|[+-]\d{2}:\d{2}$/.test(utcDateStr)) {
      utcDateStr += "Z";
    }

    var utcDate = new Date(utcDateStr);
    var day = String(utcDate.getDate()).padStart(2, "0");
    var month = String(utcDate.getMonth() + 1).padStart(2, "0");
    var hour = String(utcDate.getHours()).padStart(2, "0");
    var minute = String(utcDate.getMinutes()).padStart(2, "0");

    $(this).html(day + "/" + month + ", " + hour + ":" + minute);
  });

  function normalizeServerRenderedSlick(element) {
    var $element = $(element);

    if (!$element.hasClass("slick-initialized") || $element.data("slick")) {
      return;
    }

    var $tips = $element.find(".tip-item").detach();
    $element
      .removeClass("slick-initialized slick-slider slick-dotted")
      .removeAttr("role")
      .empty()
      .append($tips);

    $tips.removeAttr("style tabindex role aria-describedby aria-hidden data-slick-index");
  }

  function removeExpiredTips(element) {
    $(element).find(".tip-item").each(function () {
      var $content = $(this);
      var updatesLive = $content.hasClass("lo-live-updates");
      var eventDate = new Date(String($content.data("event-date") || "").replace(" ", "T")).getTime();
      var eventDatePlus2Hours = eventDate + (2 * 60 * 60 * 1000);
      var isLive = eventDate < Date.now();
      var mustRemove = (!updatesLive && isLive) || (eventDatePlus2Hours < Date.now());

      if (mustRemove) {
        $content.remove();
        return;
      }

      if (isLive) {
        $content.find(".tip-badge").removeClass("upcoming").addClass("live").text(liveodds_tips.tipStatuses.live);
      }
    });

    if ($(element).find(".tip-item").length === 0) {
      $(element).closest("section.js-odds-tips").hide();
    }
  }

  setInterval(function () {
    $(".js-odds-tips-wrapper").each(function (_, element) {
      removeExpiredTips(element);
    });
  }, 60000);
});
