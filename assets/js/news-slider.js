(function ($) {
  function initNewsSlider() {
    if (!$.fn || !$.fn.slick) {
      return;
    }

    $(".news-slider").each(function () {
      var $block = $(this);
      var $slider = $block.find(".news-slider__slider");

      if (!$slider.length || $slider.hasClass("slick-initialized")) {
        return;
      }

      $slider.slick({
        arrows: false,
        dots: false,
        infinite: false,
        slidesToShow: 3,
        slidesToScroll: 1,
        swipeToSlide: true,
        responsive: [
          {
            breakpoint: 1209,
            settings: {
              slidesToShow: 2
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1
            }
          }
        ]
      });

      $block.find(".news-slider__controls .prev").on("click", function () {
        $slider.slick("slickPrev");
      });

      $block.find(".news-slider__controls .next").on("click", function () {
        $slider.slick("slickNext");
      });

      $block.find(".news-slider__filter").on("click", function () {
        var $button = $(this);
        var filter = $button.data("filter");

        $button.addClass("active").siblings(".news-slider__filter").removeClass("active");
        $slider.slick("slickUnfilter");

        if (filter && filter !== ".news-slider__tag--all") {
          $slider.slick("slickFilter", filter);
        }

        $slider.slick("slickGoTo", 0, true);
      });
    });
  }

  $(initNewsSlider);
})(jQuery);
