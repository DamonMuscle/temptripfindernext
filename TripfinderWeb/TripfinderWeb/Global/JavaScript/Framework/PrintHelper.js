(function()
{
	createNamespace("TF.DetailView").PrintHelper = PrintHelper;

	function PrintHelper()
	{
		var self = this;
		self.$pagedMedia = null;
		self.updateEndMapEvents = [];
	};

	PrintHelper.prototype.updatePagedMedia = function()
	{
		var self = this, $page = $('#default-print');
		if ($page)
		{
			self.$pagedMedia = $page;
			$page.remove();
		}
	};

	PrintHelper.prototype.restorePageMedia = function()
	{
		var self = this;
		if (self.$pagedMedia)
		{
			$(document.head).append(self.$pagedMedia);
			self.$pagedMedia = null;
		}
	};

	PrintHelper.prototype.destroyMapEvents = function()
	{
		var self = this;
		$.each(self.updateEndMapEvents, function(i, item)
		{
			item.remove();
			item = null;
		});
		self.updateEndMapEvents.length = 0;
	};

	PrintHelper.prototype.preLoadMapImage = function($detailViewElement)
	{
		var self = this, $maps = $detailViewElement.find('.grid-stack-item .map'),
			map, $item, promiseAll = [];

		self.destroyMapEvents();

		$.each($maps, function(i, item)
		{
			$item = $(item);
			$item.css('width', '2000px');
			map = $item.data().map;

			promiseAll.push(new Promise(function(resolve, reject)
			{
				self.updateEndMapEvents.push(map.on("update-end", function()
				{
					resolve();
				}));
			}));
		});

		return Promise.all(promiseAll);
	};

	PrintHelper.prototype.resetMap = function($detailViewElement)
	{
		var self = this, $maps = $detailViewElement.find('.grid-stack-item .map'),
			map, $item, promiseAll = [];

		$.each($maps, function(i, item)
		{
			$item = $(item);
			$item.css('width', '');
		});
	};

	PrintHelper.prototype.processLine = function($printElement)
	{
		var self = this;
		// 1px width sometimes disappear when print.
		$printElement.find('.verti-line').css({ width: '2px' });
		$printElement.find('.hori-line').css({ height: '2px' });
	};

	PrintHelper.prototype.beforePrint = function($printElement)
	{
		var self = this;
		self.updatePagedMedia();
		self.processLine($printElement);
	};

	PrintHelper.prototype.afterPrint = function()
	{
		var self = this;
		self.restorePageMedia();
		self.destroyMapEvents();
	};

	PrintHelper.prototype.print = function(detailViewElement)
	{
		var self = this, $detailViewElement = $(detailViewElement),
			$printElement = $detailViewElement.clone();
		$printElement.width(String($detailViewElement.width()) + "px").height("100%");

		return new Promise(function(resolve, reject)
		{
			self.preLoadMapImage($detailViewElement).then(function()
			{
				// remove virtual scrollbar padding.
				$printElement.find('.grid-stack-item-content .kendo-grid .k-grid-content,.grid-stack-item-content .kendo-grid .k-grid-header')
					.css("padding-right", "0px");

				$('body').append($printElement);
				$printElement.hide();

				self.beforePrint($printElement);
				setTimeout(function()
				{
					var wnd = window;
					var hasAfterPrint = 'onafterprint' in wnd;
					if (hasAfterPrint)
					{
						wnd.onafterprint = function()
						{
							resolve();
						};
					}

					wnd.print();

					if (!hasAfterPrint)
					{
						resolve();
					}
				}, 200);
			});
		}.bind(this)).then(function()
		{
			self.afterPrint();
			self.resetMap($detailViewElement);
			$printElement.remove();
		});
	};

})();