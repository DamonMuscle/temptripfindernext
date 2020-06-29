(function()
{
	var namespace = createNamespace("TF.Helper");

	namespace.QuickSearchHelper = QuickSearchHelper;

	var KeyCodeUp = 38;
	var KeyCodeDown = 40;

	function QuickSearchHelper(elementQuery, itemsToSkip, findAllElements, select, selectedInfo)
	{
		var self = this;
		self._searchText = "";
		self._selectedInfo = selectedInfo;
		self._lastChar = null;
		self._typingTimeout = null;
		self.elementQuery = elementQuery;
		self.itemsToSkip = itemsToSkip;
		self.findAllElements = findAllElements;
		self.select = select;
	}

	QuickSearchHelper.prototype.constructor = QuickSearchHelper;

	QuickSearchHelper.prototype.quickSearch = function(e)
	{
		var self = this;
		var keyCode = e.keyCode || e.which;

		if (keyCode >= 96 && keyCode <= 105)
		{
			// numeric keypad.
			keyCode -= 48;
		}

		if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 65 && keyCode <= 90) || keyCode === 32 || keyCode === 191 || (keyCode === 189 && e.shiftKey))
		{
			var character = null;
			switch (keyCode)
			{
				case 191:
					character = "/";
					break;
				case 189:
					character = "_";
					break;
				case 51:
					if (e.shiftKey)
					{
						character = "#";
					}
					break;
				default:
					character = String.fromCharCode(keyCode).toLowerCase();
			}
			self._findItem(character);
			e.preventDefault();
			return;
		}
		else if (keyCode == KeyCodeUp ||
			keyCode == KeyCodeDown)
		{
			if (Number.isInteger(self._selectedInfo._selectedIndex))
			{
				var maxIdx = self._selectedInfo.findAllElements().length - 1;
				var minIdx = 0;
				var newSelectedIdx = self._selectedInfo._selectedIndex;
				var offSet = (keyCode == KeyCodeUp) ? -1 : 1;
				var tmpSelectedIdx = self._selectedInfo._selectedIndex + offSet;
				if (keyCode == KeyCodeUp)
				{
					newSelectedIdx = (tmpSelectedIdx >= minIdx) ? tmpSelectedIdx : maxIdx;
				}
				else
				{
					newSelectedIdx = tmpSelectedIdx <= maxIdx ? tmpSelectedIdx : minIdx;
				}

				self.select(newSelectedIdx);
				e.preventDefault();
				return;
			}
		}
	};

	QuickSearchHelper.prototype._findItem = function(char)
	{
		var self = this,
			searchTextLength = self._searchText.length;

		if (searchTextLength === 0)
		{
			self._searchText = char;
		}

		if (self._lastChar === char && self._searchText.length <= 1 && self._selectedInfo._selectedIndex != null)
		{
			self._search(self._selectedInfo._selectedIndex);
			return;
		}

		if (searchTextLength > 0)
		{
			self._searchText += char;
		}

		self._lastChar = char;

		self._search();
	};

	QuickSearchHelper.prototype._search = function(startIndex)
	{
		var self = this,
			allElements = self.findAllElements(),
			itemText, searchIndex = null, searchItem = function()
			{
				$.each(allElements, function(index, item)
				{
					if (startIndex != null && index <= startIndex) return;
					if (self.elementQuery)
					{
						itemText = $(item).find(self.elementQuery).text().toLowerCase();
					}
					else
					{
						itemText = $(item).text().toLowerCase();
					}
					var toSkip = self.itemsToSkip.some(function(i) { return i === itemText; });
					if (toSkip) return true;

					if (itemText.indexOf(self._searchText) === 0)
					{
						searchIndex = index;
						return false;
					}
				});
			};

		clearTimeout(self._typingTimeout);

		self._typingTimeout = setTimeout(function()
		{
			self._searchText = "";
		}, 1000);

		searchItem();

		if (searchIndex == null)
		{
			startIndex = null;
			searchItem();
		}

		if (searchIndex != null)
		{
			self.select(searchIndex);
		}
	};

	QuickSearchHelper.prototype.findAllElements = function(startIndex)
	{
		throw "findAllElements NOT IMPLEMENTED";
	};

	QuickSearchHelper.prototype.select = function(startIndex)
	{
		throw "findAllElements NOT IMPLEMENTED";
	};

	/**
	 * Dispose this helper.
	 *
	 */
	QuickSearchHelper.prototype.dispose = function()
	{

	};
})()