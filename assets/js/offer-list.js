jQuery(function ($) {
  var rootSelector = ".offers";
  var listSelector = ".offers__list:not(.offers__illegal-list)";
  var cardSelector = ".offer-card";

  $(document).on("click", ".offers__control-title", function () {
    $(this).toggleClass("active").siblings(".offers__control-buttons").toggleClass("active");
  });

  $(document).on("click", function (event) {
    var $filters = $(".offers__filters");
    if (!$filters.is(event.target) && !$filters.has(event.target).length) {
      $(".offers__control-title, .offers__control-buttons").removeClass("active");
    }

    var $payments = $(".payment-list");
    if (!$payments.is(event.target) && !$payments.has(event.target).length) {
      $(".payment-list").removeClass("hover");
    }
  });

  $(document).on("click", ".offers__sort-btn", function () {
    var $button = $(this);
    var $offers = $button.closest(rootSelector);
    var sortBy = $button.data("sort");

    $button.siblings().removeClass("active");
    $button.addClass("active");
    dataOrder($offers, sortBy);
  });

  $(document).on("click", ".offers button.view-all", function () {
    var $list = $(this).closest(listSelector);
    var postsToShow = parseInt($(this).data("posts_to_show") || $(this).data("posts-to-show") || $list.data("ntoshow") || 0, 10);
    var showing = parseInt($list.attr("data-showing") || 0, 10);

    $list.attr("data-showing", showing + postsToShow);
    showCards($list);
  });

  $(document).on("click", ".payment-list, .pm-wrapper", function (event) {
    event.stopPropagation();
    var $paymentList = $(this).hasClass("payment-list") ? $(this) : $(this).parent();
    $(".payment-list").not($paymentList).removeClass("hover");
    $paymentList.toggleClass("hover");
  });

  $(document).on("click", "[data-see-more-illegal]", function () {
    var $list = $(this).closest(".offers__illegal-list");
    var perPage = parseInt($list.data("perpage") || 6, 10);
    var $hiddenCards = $list.find(cardSelector + ".hidden").slice(0, perPage);

    $hiddenCards.removeClass("hidden");
    if (!$list.find(cardSelector + ".hidden").length) {
      $(this).hide();
    }
  });

  function showCards($list) {
    var show = parseInt($list.attr("data-showing") || 0, 10);
    var $cards = $list.children(cardSelector);

    if (show === 0) {
      $cards.removeClass("hidden");
    } else {
      $cards.addClass("hidden");
      $cards.each(function (_, card) {
        if (show > 0) {
          $(card).removeClass("hidden");
          show--;
        }
      });
    }

    var total = $cards.length;
    var totalVisible = $cards.not(".hidden").length;
    var currentShowing = parseInt($list.attr("data-showing") || 0, 10);

    if (currentShowing >= total || currentShowing > totalVisible) {
      $list.find("button.view-all").hide();
    } else {
      $list.find("button.view-all").show();
    }
  }

  function dataOrder($offers, attribute, number) {
    if (number === undefined) {
      number = true;
    }

    var sortDirection = "asc";
    if (attribute === "menu_order") {
      attribute = "order";
      sortDirection = "desc";
    }

    var dataAttribute = "data-" + attribute;
    var $list = $offers.find(listSelector).first();

    $offers.removeClass(function (_, className) {
      return (className.match(/(^|\s)sort-by-\S+/g) || []).join(" ");
    });
    $offers.addClass("sort-by-" + dataAttribute);

    $list.children(cardSelector).sort(function (a, b) {
      var aValue = a.getAttribute(dataAttribute) || "";
      var bValue = b.getAttribute(dataAttribute) || "";

      if (number) {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return number ? bValue - aValue : String.prototype.localeCompare.call(aValue, bValue);
      }

      return number ? aValue - bValue : String.prototype.localeCompare.call(bValue, aValue);
    }).appendTo($list);

    showCards($list);
  }

  if ($.fn.tooltip) {
    $(".offers [data-toggle=\"tooltip\"]").tooltip({
      placement: "top",
      fallbackPlacement: ["top", "top", "top", "top"]
    });
  }

  $(".offers").each(function () {
    showCards($(this).find(listSelector).first());
  });
});
