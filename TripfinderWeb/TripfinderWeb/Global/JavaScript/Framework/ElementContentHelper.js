(function()
{
	createNamespace("TF.Helper").ElementContentHelper = ElementContentHelper;

	function ElementContentHelper()
	{
		var self = this;
		self.autofitWidthCss = { "display": "inline", "width": "auto", "padding-left": 0, "padding-right": 0 };
		self.resetCss = { "display": "", "width": "", "padding-left": "", "padding-right": "" };
	}

	/**
	 * Reduce the font-size until the minimum is reached.
	 * @param {type} $elementList The element list.
	 * @param {type} maxFontSize The maximum font size.
	 * @param {type} minFontSize The minimum font size.
	 * @param {type} maxWidth The maximum width of the element.
	 * @returns {void} 
	 */
	ElementContentHelper.prototype.reduceFontSizeUntil = function($elementList, maxFontSize, minFontSize, maxWidth)
	{
		var self = this;

		$.each($elementList, function(index, item)
		{
			$el = $(item);

			// Set style so the width will auto-adjust.
			$el.css(self.autofitWidthCss);
			$el.css("font-size", maxFontSize);

			var fontSize = maxFontSize;
			while ($el.outerWidth() >= maxWidth && fontSize-- > minFontSize)
			{
				$el.css("font-size", fontSize)
			}

			// Set style back to original.
			$el.css(self.resetCss);
			$el.css("width", maxWidth);
		});
	};

	/**
	 * Bolden the target text witin the content.
	 * @param {type} $elementList The element list.
	 * @param {type} keyword The target keyword text.
	 * @param {type} isCaseSensitive Whether it is case sensitive.
	 * @returns {void} 
	 */
	ElementContentHelper.prototype.boldenKeywords = function($elementList, keywords, isCaseSensitive)
	{
		var self = this,
			$el, htmlContent, matches, kwsTemp, tmp, searchRegex;

		// Form the regex for keywords
		kwsTemp = keywords.map(function(item)
		{
			tmp = item;
			tmp = self.escapeRegexSpecialCharacters(tmp);
			tmp = self.escapeHtmlSpecialCharacters(tmp);

			return tmp;
		});
		searchRegex = "(" + kwsTemp.join("|") + ")";

		$.each($elementList, function(elementIdx, item)
		{
			$el = $(item);
			htmlContent = $el.text();
			htmlContent = self.escapeHtmlSpecialCharacters(htmlContent);
			htmlContent = htmlContent.replace(new RegExp(searchRegex, isCaseSensitive ? "g" : "ig"), function(match)
			{
				return "<b>" + match + "</b>";
			});
			$el.html(htmlContent);
		});
	};

	/**
	 * An enhanced algorithm to avoid situation like searching "aa" in "aaa" or "aa, ab" in "aab".
	 * @param {type} $elementList
	 * @param {type} keywords
	 * @param {type} isCaseSensitive
	 * @returns {type} 
	 */
	ElementContentHelper.prototype.boldenKeywordsInText = function($elementList, keywords, isCaseSensitive)
	{
		var self = this,
			$el, htmlContent, kwRanges, kwTemp, rangeListTemp, field;

		$.each($elementList, function(elementIdx, elementItem)
		{
			$el = $(elementItem);
			field = $el.attr("bind-field");
			if (field && ko.dataFor($el[0]))
			{
				htmlContent = ko.dataFor($el[0])[field];
			}
			else
			{
				htmlContent = $el.text();
			}
			kwRanges = [];

			$.each(keywords, function(keywordIdx, keywordItem)
			{
				kwTemp = self.escapeHtmlSpecialCharacters(keywordItem);
				rangeListTemp = self.getKeywordRangesInText(kwTemp, htmlContent);
				kwRanges = kwRanges.concat(rangeListTemp);
			});

			kwRanges = self.unionRangesInList(kwRanges);
			htmlContent = self.createBoldenContentWithRangeList(htmlContent, kwRanges);
			$el.html(htmlContent);
		});
	};

	/**
	 * Get the list of ranges for the keyword.
	 * @param {string} keyword The keyword.
	 * @param {string} text The content.
	 * @returns {Array} The array of the ranges. 
	 */
	ElementContentHelper.prototype.getKeywordRangesInText = function(keyword, text)
	{
		var baseIdx = 0, rangeList = [],
			kwLength = keyword.length,
			textTmp = text.toLowerCase(),
			kwTmp = keyword.toLowerCase(),
			kwIdx = textTmp.indexOf(kwTmp);

		while (kwIdx !== -1)
		{
			rangeList.push([baseIdx + kwIdx, baseIdx + kwIdx + kwLength]);
			baseIdx += (kwIdx + 1);
			textTmp = textTmp.substring(kwIdx + 1, textTmp.length);

			kwIdx = textTmp.indexOf(kwTmp);
		}

		return rangeList;
	};

	/**
	 * Union the ranges in an array.
	 * @param {Array} rangeList The array that contains the ranges.
	 * @returns {Array} The unioned ranges.
	 */
	ElementContentHelper.prototype.unionRangesInList = function(rangeList)
	{
		var idx, result = [];

		for (idx = 0; idx < rangeList.length; idx++)
		{
			result = this.mergeNewRangeToTheList(rangeList[idx], result);
		}

		return result;
	};

	/**
	 * Merge a range to a list of ranges.
	 * @param {Array} newRange The new range.
	 * @param {Array} originalRange The original range list.
	 * @returns {Array} The new range array. 
	 */
	ElementContentHelper.prototype.mergeNewRangeToTheList = function(newRange, rangeList)
	{
		var resultList = rangeList,
			newMin = newRange[0],
			newMax = newRange[1],
			executeFlag = false,
			idx, rangeTmp, originMin, originMax;


		for (idx = 0; idx < rangeList.length; idx++)
		{
			rangeTmp = rangeList[idx],
				tmpMin = rangeTmp[0],
				tmpMax = rangeTmp[1];

			if (newMin <= tmpMax && newMax >= tmpMin)
			{
				rangeList[idx] = [Math.min(newMin, tmpMin), Math.max(newMax, tmpMax)];
				executeFlag = true;
			}
		}

		if (!executeFlag)
		{
			rangeList.push(newRange);
		}

		return rangeList;
	};

	/**
	 * Add <b> tags in the content to bold keywords using the ranges.
	 * @param {string} content The original html content.
	 * @param {Array} rangeList The range array.
	 * @returns {string} The html content with keywords bolded. 
	 */
	ElementContentHelper.prototype.createBoldenContentWithRangeList = function(content, rangeList)
	{
		var idx, leftIdx, rightIdx, rangeTmp,
			result = content;
		sortedList = rangeList.sort(function(a, b) { return (a[0] - b[0] >= 0) ? 1 : -1; });

		for (var idx = sortedList.length - 1; idx >= 0; idx--)
		{
			rangeTmp = sortedList[idx];
			leftIdx = rangeTmp[0];
			rightIdx = rangeTmp[1];

			result = result.substring(0, rightIdx) + "</b>" + result.substring(rightIdx, result.length);
			result = result.substring(0, leftIdx) + "<b>" + result.substring(leftIdx, result.length);
		}

		return result;
	};

	/**
	 * Truncate the string to display the search text in the content for the best.
	 * The logic may be better organized and simplified in the future.
	 * 1) Check if the content width exceeds the width;
	 * 2) Check if "(...)[TargetText](...)" exceeds;
	 * 3) Check if "(...)[Keyword](...)" exceeds;
	 * 4) If 3 is true, try removing a character after the target one at a time, 
	 *    if the tail is reached, try removing the characters before the target, until the width is fine for display
	 * 5) If 3 is false, check if "[FirstWord...Keyword(...)]" exceeds the width
	 * 6) If 5 is true, do 4 and 5;
	 * 7) If 5 is false, try removing the characters that is after the first word and before the keyword 
	 *    one at a time until the width is fine.
	 * @param {type} $elList The element list.
	 * @param {type} target The target text.
	 * @param {type} width The maximum width of the element.
	 * @returns {void} 
	 */
	ElementContentHelper.prototype.adjustTextWithKeywordForDisplay = function($elList, targets, width)
	{
		var self = this,
			$el, targetRegex, keywordRegex, tmp;

		targets = targets.map(self.escapeRegexSpecialCharacters);
		targetRegex = new RegExp("<b>[^\<\>]*<\/b>", "i");
		keywordRegex = new RegExp("\\w*<b>[^\<\>]*<\/b>\\w*", "i");

		$.each($elList, function(idx, item)
		{
			if ($el)
			{
				$el.css(self.resetCss);
				$el.css("width", width);
			}

			$el = $(item);
			$el.css(self.autofitWidthCss);

			// The whole content does not exceed width limit.
			if ($el.width() < width) { return true; }

			// Check if the target text exceeds the width limit.
			var content = $el.html(),
				targetMatch = content.match(targetRegex),
				targetContent, targetTailIndex;

			if (!targetMatch) { return true; }

			targetContent = targetMatch[0],
				targetTailIndex = targetMatch.index + targetContent.length,
				isTargetAtHead = (targetMatch.index === 0),
				isTargetAtTail = (targetTailIndex === content.length);

			tmp = (isTargetAtHead ? "" : "...") + targetContent + (isTargetAtTail ? "" : "...");
			if (self.getTextWidthInElement($el, tmp) >= width)
			{
				$el.html(tmp);
				return true;
			}

			// Check if the keyword (the word that contains the target text) exceeds the width limit.
			var keywordMatch = content.match(keywordRegex),
				keywordContent, keywordTailIndex, isKeywordAtTail;

			if (!keywordMatch) { return true; }

			keywordContent = keywordMatch[0],
				keywordTailIndex = keywordMatch.index + keywordContent.length,
				isKeywordAtHead = (keywordMatch.index === 0),
				isKeywordAtTail = (keywordTailIndex === content.length);

			// The original content exceed the width limit, but the first keyword is within, nothing needs to be done.
			tmp = content.substring(0, keywordTailIndex) + "...";
			if (self.getTextWidthInElement($el, tmp) < width) { return true; }

			// The keyword is too long to be displayed along with other words.
			tmp = (isKeywordAtHead ? "" : "...") + keywordContent + (isKeywordAtTail ? "" : "...");
			if (self.getTextWidthInElement($el, tmp) >= width)
			{
				var charCountAfterTargetInKeyword = keywordTailIndex - targetTailIndex,
					headTruncated = false, tailTruncated = false;

				do
				{
					if (charCountAfterTargetInKeyword-- > 0)
					{
						keywordContent = keywordContent.substring(0, keywordContent.length - 1);
						tailTruncated = true;
					}
					else
					{
						keywordContent = keywordContent.substring(1, keywordContent.length);
						headTruncated = true;
					}

					tmp = (headTruncated || !isKeywordAtHead ? "..." : "") + keywordContent + (tailTruncated || !isKeywordAtTail ? "..." : "");
				} while (self.getTextWidthInElement($el, tmp) >= width)

				$el.html(tmp);
				return true;
			}

			// "[FirstWord]...[KeyWord]..." is too long, only some characters in the first word can be included.
			var firstwordRegex = new RegExp("^\\w*\\b", "i"),
				firstWordMatch = content.match(firstwordRegex),
				firstWordContent = firstWordMatch[0],
				firstWordTailIndex = firstWordMatch.index + firstWordContent.length;

			tmp = (isKeywordAtHead ? "" : "...") + keywordContent + (isKeywordAtTail ? "" : "...");
			if (self.getTextWidthInElement($el, firstWordContent + tmp) >= width)
			{
				do
				{
					firstWordContent = firstWordContent.substring(0, firstWordContent.length - 1);
				} while (self.getTextWidthInElement($el, firstWordContent + tmp) >= width)

				$el.html(firstWordContent + tmp);
				return true;
			}

			// If none of the situations above is matched, display "[FirstWord]...[content][KeyWord]...".
			tmp = content.substring(firstWordTailIndex, keywordTailIndex) + (isKeywordAtTail ? "" : "...");
			while (self.getTextWidthInElement($el, firstWordContent + "..." + tmp) >= width)
			{
				tmp = tmp.substring(1, tmp.length);
			}

			$el.html(firstWordContent + "..." + tmp);
		});

		$elList.css(self.resetCss);
		$elList.css("width", width);
	};

	/**
	 * Remove duplicated items in an array.
	 * @param {Array} array
	 * @returns {void} 
	 */
	ElementContentHelper.prototype.removeDuplicatedItem = function(array)
	{
		var item, idx = 0, hashMap = {};

		while (idx < array.length)
		{
			item = array[idx];
			if (hashMap[item] !== undefined)
			{
				array.splice(idx, 1);
			}
			else
			{
				hashMap[item] = idx;
				idx++;
			}
		}
	};

	/**
	 * Get the width of the content in specified element.
	 * @param {jquery} $el The element.
	 * @param {string} html The html content.
	 * @returns {number} The width. 
	 */
	ElementContentHelper.prototype.getTextWidthInElement = function($el, html)
	{
		var width, tmp = $el.html();

		width = $el.html(html).width();
		$el.html(tmp);

		return width;
	};

	/**
	 * Escape regex special characters in the string.
	 * @param {string} str The input string.
	 * @returns {string} The processed result. 
	 */
	ElementContentHelper.prototype.escapeRegexSpecialCharacters = function(str)
	{
		var result = str.replace(/[\|.()\/^$+*?{}\[\]!]/g, function(match)
		{
			return "\\" + match;
		});

		return result;
	};

	/**
	 * Escape html special characters in the string.
	 * @param {string} str The input string.
	 * @returns {string} The processed result. 
	 */
	ElementContentHelper.prototype.escapeHtmlSpecialCharacters = function(str)
	{
		var result = str.replace(/[<>]/g, function(match)
		{
			switch (match)
			{
				case "<":
					return "&#60;";
				case ">":
					return "&#62;";
				default:
					break;
			}
		});

		return result;
	};
})();