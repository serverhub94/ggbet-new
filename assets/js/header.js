(function ($) {
  function setExpanded($toggle, expanded) {
    $toggle.attr("aria-expanded", expanded ? "true" : "false");
    $toggle.find(".nav-menu__caret, .caret").toggleClass("active", expanded);
    $toggle.toggleClass("show active", expanded);
  }

  function closeNestedMenus($scope, except) {
    $scope.find(".dropdown-menu, .nav-menu__submenu").each(function () {
      var $menu = $(this);
      var $toggle = $menu.prev("a");

      if (except && ($menu[0] === except[0] || $.contains($menu[0], except[0]))) {
        return;
      }

      $menu.hide();
      setExpanded($toggle, false);
    });
  }

  function toggleMenu($toggle, $menu) {
    var willOpen = !$menu.is(":visible");
    var $siblings = $toggle.closest("li").siblings();

    closeNestedMenus($siblings, null);
    $menu.toggle(willOpen);
    setExpanded($toggle, willOpen);
  }

  function closeMobileMenu() {
    var $toggle = $(".navbar-toggler");

    $(".sidebar-nav, .page__overlay").removeClass("active");
    $toggle.removeClass("active").attr("aria-expanded", "false");
    $("body").removeClass("noscroll");
    closeNestedMenus($(".sidebar-nav"), null);
  }

  function initHeaderScroll($header) {
    var didScroll = false;
    var lastScrollTop = 0;
    var delta = 5;
    var initialThreshold = 69;
    var hideThreshold = 40;
    var scrollTimer;

    function getDisclaimerGap() {
      var $disclaimer = $(".age-disclaimer");

      return $disclaimer.length ? Math.max(40, $disclaimer.outerHeight() || 0) : 0;
    }

    function updateHeaderTop() {
      var gap = $header.hasClass("header--with-disclaimer") ? getDisclaimerGap() : 0;
      var scrollTop = $(window).scrollTop();

      if ($header.hasClass("nav-up")) {
        $header.css("top", -$header.outerHeight() + "px");
        return;
      }

      if (gap && scrollTop <= gap) {
        $header.css("top", gap - scrollTop + "px");
        return;
      }

      $header.css("top", 0);
    }

    function checkScrolledHeader() {
      var scrollTop = Math.max(window.scrollY || 0, window.pageYOffset || 0);
      var isScrolled = scrollTop > initialThreshold;

      $(".sidebar-nav").toggleClass("scrolled", isScrolled);
      $(".nobettinglist").css("position", isScrolled ? "relative" : "fixed");
      $header.toggleClass("header--initial", !isScrolled);
    }

    function hasScrolled() {
      var scrollTop = $(window).scrollTop();

      if (Math.abs(lastScrollTop - scrollTop) <= delta) {
        return;
      }

      if (scrollTop > lastScrollTop && scrollTop > hideThreshold) {
        $header.removeClass("nav-down").addClass("nav-up");
        $("body").removeClass("nav-down").addClass("nav-up");
      } else if (scrollTop + $(window).height() < $(document).height()) {
        $header.removeClass("nav-up").addClass("nav-down");
        $("body").removeClass("nav-up").addClass("nav-down");
      }

      lastScrollTop = scrollTop;
      updateHeaderTop();
    }

    $(window).on("scroll", function () {
      checkScrolledHeader();
      updateHeaderTop();
      didScroll = true;
      closeNestedMenus($header, null);
    });

    $(window).on("resize", updateHeaderTop);

    scrollTimer = window.setInterval(function () {
      if (didScroll) {
        hasScrolled();
        didScroll = false;
      }
    }, 250);

    $header.data("newThemeHeaderScrollTimer", scrollTimer);
    checkScrolledHeader();
    updateHeaderTop();
  }

  function initHeader() {
    var $header = $(".header");

    if (!$header.length) {
      return;
    }

    $(".dropdown-menu, .nav-menu__submenu").hide();

    $header.find(".dropdown-toggle, .nav-menu__submenu-toggle").each(function (index) {
      var $toggle = $(this);
      var $menu = $toggle.next(".dropdown-menu, .nav-menu__submenu");

      if (!$menu.length) {
        return;
      }

      var id = $menu.attr("id") || "new-theme-menu-" + index;
      $menu.attr("id", id);
      $toggle.attr({
        "aria-controls": id,
        "aria-expanded": "false"
      });
    });

    $header.on("click", ".dropdown-toggle, .nav-menu__submenu-toggle", function (event) {
      var $toggle = $(this);
      var $menu = $toggle.next(".dropdown-menu, .nav-menu__submenu");

      if (!$menu.length) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      toggleMenu($toggle, $menu);
    });

    $header.on("keydown", ".dropdown-toggle, .nav-menu__submenu-toggle", function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      $(this).trigger("click");
    });

    $(".dropdown-menu").each(function () {
      var menu = this;
      var parent = menu.parentNode;

      if (!parent) {
        return;
      }

      parent.addEventListener("mouseenter", function () {
        if (menu.getBoundingClientRect().right > window.innerWidth) {
          menu.classList.add("invert-side");
        }
      });

      parent.addEventListener("mouseleave", function () {
        menu.classList.remove("invert-side");
      });
    });

    $(".navbar-toggler, .page__overlay").on("click", function () {
      var $toggle = $(".navbar-toggler");
      var willOpen = !$toggle.hasClass("active");

      $(".sidebar-nav, .page__overlay").toggleClass("active", willOpen);
      $toggle.toggleClass("active", willOpen).attr("aria-expanded", willOpen ? "true" : "false");
      $("body").toggleClass("noscroll", willOpen);

      if (!willOpen) {
        closeNestedMenus($(".sidebar-nav"), null);
      }
    });

    $(document).on("click", function (event) {
      if (!$(event.target).closest(".header").length) {
        closeNestedMenus($header, null);
      }
    });

    $(document).on("keydown", function (event) {
      if (event.key === "Escape") {
        closeMobileMenu();
        closeNestedMenus($header, null);
      }
    });

    if ($("#primaryNavBar .badge-novo, #primaryNavBar .badge-new, #primaryNavBar .header__badge").length) {
      $(".navbar-toggler").addClass("has-new");
    }

    $('.menu-item a[href="' + window.location.href + '"]').attr("href", "#");

    initHeaderScroll($header);
  }

  $(initHeader);
})(jQuery);
