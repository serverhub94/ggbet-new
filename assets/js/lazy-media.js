(function ($) {
  function loadElement(element) {
    var $element = $(element);
    var src = $element.attr("data-lazy-src");
    var srcset = $element.attr("data-lazy-srcset");
    var bg = $element.attr("data-bg");

    if (src) {
      $element.attr("src", src).removeAttr("data-lazy-src");
    }

    if (srcset) {
      $element.attr("srcset", srcset).removeAttr("data-lazy-srcset");
    }

    if (bg) {
      element.style.backgroundImage = "url(" + bg + ")";
      $element.removeAttr("data-bg");
    }

    $element.addClass("entered lazyloaded").attr("data-ll-status", "loaded");
  }

  function initLazyMedia() {
    var selector = "[data-lazy-src], [data-lazy-srcset], [data-bg]";

    if (!("IntersectionObserver" in window)) {
      $(selector).each(function () {
        loadElement(this);
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        loadElement(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "200px 0px"
    });

    function observe() {
      $(selector).each(function () {
        observer.observe(this);
      });
    }

    observe();

    if ("MutationObserver" in window) {
      new MutationObserver(observe).observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  $(initLazyMedia);
})(jQuery);
