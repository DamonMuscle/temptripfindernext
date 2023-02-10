(function()
{
	createNamespace("TF.Map").Search = Search;

	function Search()
	{
	}

	Search.SetSuggestionPositionFixed = function(searchbox)
	{
		var $searchboxCtrl = $(searchbox.domNode);
		var searchboxOffset = $searchboxCtrl.offset();
		var searchboxHeight = $searchboxCtrl.height();
		var $suggestionCtrl = $(searchbox._suggestionListNode);
		$suggestionCtrl.show();
		$suggestionCtrl.css('position', 'fixed');
		$suggestionCtrl.css('left', searchboxOffset.left + 'px');
		$suggestionCtrl.css('top', (searchboxOffset.top + searchboxHeight) + 'px');
		setTimeout(function()
		{
			var searchboxWidth = $searchboxCtrl.outerWidth();
			$suggestionCtrl.css('width', searchboxWidth + 'px');
		});
	};

})();