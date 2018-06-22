(function()
{
	createNamespace("TF").PrintHelper = PrintHelper;

	function PrintHelper()
	{
	}

	createNamespace("TF").PrintHelper = {}
	createNamespace("TF").PrintHelper.HeadSize = '';
	createNamespace("TF").PrintHelper.LastColumnWidth = '';

	$( window ).resize(function() {
	  var height = $(window).height();
		var width = $(window).width();
		cssPagedMedia.size(width + 65 + "px",height + 65 + "px");
	});

  var cssPagedMedia = (function () {
      var style = document.createElement('style');
	  style.id = "default-print";
      document.head.appendChild(style);
      return function (rule) {
          style.innerHTML = rule;
      };
  }());

  cssPagedMedia.size = function (width,height) {
		// var ua = window.navigator.userAgent;
		// var msie = ua.indexOf("MSIE ");
		// var msedge = ua.indexOf("Edge/");
		// var trident = ua.indexOf('Trident/');
		//
		// if (msie > 0 || msedge > 0 || trident > 0) // If Internet Explorer, return version number
		// {
		// 	cssPagedMedia('@page {size: ' + 'B4 landscape;' + '}');
		// }
		// else
		// {
	    cssPagedMedia('@page {size: ' + width + ' ' + height + '}');
		// }
  };

  cssPagedMedia.size($(window).width() + 65 + "px", $(window).height() + 65 + "px");

	var beforePrint = function() {
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf("MSIE ");
		var msedge = ua.indexOf("Edge/");
		var trident = ua.indexOf('Trident/');

		if (msie > 0 || msedge > 0 || trident > 0) // If Internet Explorer, return version number
		{
			var $content = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-grid-container .k-virtual-scrollable-wrap");
			var $header = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .k-grid-header-wrap");
			var $locked_header = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-grid-container .k-grid-header-locked");
			var $locked_content = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .k-grid-content-locked");
			var $summary_bar_context = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-summarygrid-container .k-grid-content");
			var $summary_bar_header_locked = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-summarygrid-container .k-grid-header-locked");
			var $content_container = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-grid-container .k-grid-content");
			var $grid_filter_Layout = $(".grid-staterow").parent();
			var $last_column = $content.find('.table-blank-fullfill col:last');
			var $div = $('.kendogrid-blank-fullfill');
			var scrol_left_length = $content.scrollLeft();
			$div.css('display','none');
			TF.PrintHelper.LastColumnWidth = $last_column.css('width');
			$last_column.css('width','1000px');
			$grid_filter_Layout.css('float', '');
			$grid_filter_Layout.css('margin-right', 10 + 'px');
			$locked_header.addClass('scroll-in-ie-locked-area');
			$locked_content.addClass('scroll-in-ie-locked-content-area');
			$summary_bar_header_locked.addClass('scroll-in-ie-locked-area');
			$content_container.css('width', $(window).width() + scrol_left_length + 'px');
			$content_container.css('left', '-' + scrol_left_length  + 'px');
			$content.css('width', $(window).width() + scrol_left_length + 'px');
			$summary_bar_context.css('width', $(window).width() + scrol_left_length + 'px');
			$summary_bar_context.css('left', '-' + scrol_left_length  + 'px');
			TF.PrintHelper.HeadSize = $header.css('width');
			$header.css('width',$(window).width() + scrol_left_length + 'px');
			$header.css('left', '-' + scrol_left_length  + 'px');
		}
 	};

	var afterPrint = function() {
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf("MSIE ");
		var msedge = ua.indexOf("Edge/");
		var trident = ua.indexOf('Trident/');

		if (msie > 0 || msedge > 0 || trident > 0) // If Internet Explorer, return version number
		{
			var $content = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-grid-container .k-virtual-scrollable-wrap");
			var $header = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .k-grid-header-wrap");
			var $locked_header = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-grid-container .k-grid-header-locked");
			var $locked_content = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .k-grid-content-locked");
			var $summary_bar_context = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-summarygrid-container .k-grid-content");
			var $summary_bar_header_locked = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-summarygrid-container .k-grid-header-locked");
			var $content_container = $(".doc:not([style*='visibility: hidden']) > .doc.document-grid .kendo-grid-container .k-grid-content");
			var $grid_filter_Layout = $(".grid-staterow").parent();
			var $last_column = $content.find('.table-blank-fullfill col:last');
			var $div = $('.kendogrid-blank-fullfill');
			$div.removeAttr('style');
			$last_column.css('width',TF.PrintHelper.LastColumnWidth);
			$grid_filter_Layout.css('float', 'right');
			$grid_filter_Layout.css('margin-right', 0);
			$locked_header.removeClass('scroll-in-ie-locked-area');
			$locked_content.removeClass('scroll-in-ie-locked-content-area');
			$summary_bar_header_locked.removeClass('scroll-in-ie-locked-area');
			$content_container.css('width',TF.PrintHelper.HeadSize);
			$content_container.css('left', '0px');
			$content.removeAttr('style');
			$header.css('width',TF.PrintHelper.HeadSize);
			$header.css('left', '0px');
			$summary_bar_context.css('width',TF.PrintHelper.HeadSize);
			$summary_bar_context.css('left', '0px');
		}
	};

	if (window.matchMedia) {
	    var mediaQueryList = window.matchMedia('print');
	    mediaQueryList.addListener(function(mql) {
	        if (mql.matches) {
	            beforePrint();
	        } else {
	            afterPrint();
	        }
	    });
	}

  window.onbeforeprint = beforePrint;
  window.onafterprint = afterPrint;
})()
