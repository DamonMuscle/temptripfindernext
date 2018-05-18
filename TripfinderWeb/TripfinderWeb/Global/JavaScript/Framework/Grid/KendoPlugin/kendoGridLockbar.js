(function()
{
	createNamespace("TF.Grid").KendoGridLockbar = KendoGridLockbar;

	function KendoGridLockbar()
	{
		this.$lockbar = null;
		this.$container = null;
		this.kendoGrid = null;
		this.onDragEnd = new TF.Events.Event();
	}

	KendoGridLockbar.prototype._createLockbar = function ($container, kendoGrid) {
		this.$container = $container;
		this.kendoGrid = kendoGrid;
		var $lockbar = this.$lockbar;
		if ($lockbar && $container.find('.tf-mobile-grid-lockbar').length > 0)
			return $lockbar;

		$lockbar = $('<div class="tf-mobile-grid-lockbar"></div>');
		$container.append($lockbar);

		this.$lockbar = $lockbar;
		return this;
	};

	KendoGridLockbar.prototype.dispose = function () {
		this.$lockbar = null;
		this.onDragEnd.unsubscribeAll();
		// this.$container = null;
		// this.kendoGrid = null;
	};

	KendoGridLockbar.prototype._resetlockbarPosition = function () {
		var $lockbar = this.$lockbar;
		if (!$lockbar)
			return;

		var $lockedContent = this.$container.find(".k-grid-content-locked");
		var $gridHeader = this.$container.find(".k-grid-header");
		var top = $gridHeader.height();
		var left = $lockedContent.width() - 9;

		$lockbar.css("top", top + "px");
		$lockbar.css("left", left + "px");
	};

	KendoGridLockbar.prototype._resetlockbarHeight = function () {
		var $lockbar = this.$lockbar;
		if (!$lockbar)
			return;

		var $lockedContent = this.$container.find(".k-grid-content-locked");
		var height = $lockedContent.height();

		// var obSummaryGridVisible = this.obSummaryGridVisible();
		// if (obSummaryGridVisible)
		// 	height += this.summaryHeight;

		$lockbar.height(height);
	};

	KendoGridLockbar.prototype._bindEvent = function(){
		if (!this.$lockbar)
			return;

		this.$lockbar.kendoDraggable({
			hint: this._hint.bind(this),
			axis:'x',
			holdToDrag:true,
			// distance:5,
			hold: this._draggableOnHold.bind(this),
			// dragcancel: this._draggableOnDragCancel.bind(this),
			dragstart: this._draggableOnDragStart.bind(this),
			drag: this._draggableOnDrag.bind(this),
			dragend: this._draggableOnDragEnd.bind(this),
		});
	};

	KendoGridLockbar.prototype._hint = function() {
		var $lockbar = this.$lockbar;
		return $lockbar.clone().addClass("clone");
	};

	KendoGridLockbar.prototype._draggableOnHold = function(e) {
		this.$lockbar.addClass("move");
	};

	// KendoGridLockbar.prototype._draggableOnDragCancel = function(e) {
	// 	this.$lockbar.remove("move");
	// };

	KendoGridLockbar.prototype._draggableOnDragStart = function(e) {
		var $gridContainer = this.$container;

		var $corver = $('<div class="tf-mobile-grid-column-loced-corver"></div>');
		var $clone = $(".clone");

		$corver.css('height', $clone.height() + 'px');
		$corver.css('top', $gridContainer.find('thead:first').height() + 'px');

		$gridContainer.append($corver);
	};

	KendoGridLockbar.prototype._draggableOnDrag = function (e) {
		var columns = this.kendoGrid.columns;

		var lockbarOffsetX = $('.tf-mobile-grid-lockbar.clone').offset().left;
		var lockedColumnIdx = this._getLockedColumnIdxByLockbarPosition(columns, lockbarOffsetX);
		var lockedColumnCorverWidth = this._getLockedColumnCorverWidth(columns, lockedColumnIdx);
		var $lockedColumnCorver = $('.tf-mobile-grid-column-loced-corver');
		$lockedColumnCorver.css('width', lockedColumnCorverWidth + 'px');
	};

	KendoGridLockbar.prototype._getLockedColumnCorverWidth = function(columns, lockedColumnIdx) {
		var corverWidth = 0;
		columns.map(function(column, idx){
			if(idx <= lockedColumnIdx && !column.hidden){
				columnWidth = parseInt(column.width.replace('px',''));
				corverWidth += columnWidth;
			}
		});
		return corverWidth;
	};

	KendoGridLockbar.prototype._draggableOnDragEnd = function(e) {
		this.$lockbar.removeClass("move");
		var $corver = $('.tf-mobile-grid-column-loced-corver');
		$corver.remove();

		var columns = this.kendoGrid.columns;
		var offsetX = parseInt($('.tf-mobile-grid-lockbar.clone').css('left').replace('px','')); // e.clientX;

		var lockedColumnIdx = this._getLockedColumnIdxByLockbarPosition(columns, offsetX);

		if (this.onDragEnd)
			this.onDragEnd.notify(lockedColumnIdx);
	};

	KendoGridLockbar.prototype._getLockedColumnIdxByLockbarPosition = function (columns, lockbarOffsetX) {
		var lockedColumnIdx = 0;

		var columnRightBorderOffsetX = 0;
		var findIdx = false;
		columns.map(function(column, idx){
			if (findIdx)
				return;

			var columnWidth = 0;
			if(!column.hidden){
				columnWidth = parseInt(column.width.replace('px',''));
				columnRightBorderOffsetX += columnWidth;
			}

			if (columnRightBorderOffsetX >= lockbarOffsetX){
				lockedColumnIdx = idx;
				findIdx = true;
			}

			if (findIdx &&
				lockedColumnIdx > 0 &&
				lockbarOffsetX < columnRightBorderOffsetX - columnWidth / 2){
					lockedColumnIdx--;
				}
		});

		return lockedColumnIdx;
	};

})();
