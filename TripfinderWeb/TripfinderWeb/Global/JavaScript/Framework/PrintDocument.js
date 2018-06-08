(function()
{
	var namespace = createNamespace("TF");

	namespace.PrintDocument = PrintDocument;

	function PrintDocument()
	{
		this._copyCss = true;
	}

	PrintDocument.prototype.constructor = PrintDocument;

	Object.defineProperty(PrintDocument.prototype, "title", {
		get: function()
		{
			return this._title;
		},
		set: function(value)
		{
			this._title = value;
		},
		enumerable: true,
		configurable: true
	});

	Object.defineProperty(PrintDocument.prototype, "copyCss", {
		get: function()
		{
			return this._copyCss;
		},
		set: function(value)
		{
			this._copyCss = value;
		},
		enumerable: true,
		configurable: true
	});

	PrintDocument.prototype.addCSS = function(href)
	{
		if (!this._css)
		{
			this._css = [];
		}
		this._css.push(href);
	};

	PrintDocument.prototype.append = function(child)
	{
		var doc = this._getDocument();
		if (typeof child === "string")
		{
			doc.write(child);
		} else if (child instanceof HTMLElement)
		{
			doc.write(child.outerHTML);
		}
	};

	PrintDocument.prototype.print = function()
	{
		var _this = this;
		if (this._iframe)
		{
			// close the document
			this._close();

			// give it some time before printing/disposing
			setTimeout(function()
			{
				// print the document
				var wnd = _this._iframe.contentWindow;
				wnd.focus();
				wnd.print();

				// done, dispose of iframe
				document.body.removeChild(_this._iframe);
				_this._iframe = null;
			}, 200);
		}
	};

	// gets a reference to the print document
	PrintDocument.prototype._getDocument = function()
	{
		if (!this._iframe)
		{
			// create iframe
			this._iframe = document.createElement('iframe');

			// initialize iframe
			var s = this._iframe.style;
			s.position = 'fixed';
			s.left = '10000px';
			s.top = '10000px';
			document.body.appendChild(this._iframe);
		}
		return this._iframe.contentDocument;
	};

	// closes the print document before printing
	PrintDocument.prototype._close = function()
	{
		// close document before applying title and style sheets
		var doc = this._getDocument();
		doc.close();

		// add title
		if (this._title)
		{
			var et = doc.querySelector('title');
			if (!et)
			{
				et = doc.createElement('title');
				doc.head.appendChild(et);
			}
			et.textContent = this._title;
		}

		// add main document style sheets
		if (this._copyCss)
		{
			var links = document.head.querySelectorAll('LINK');
			for (var i = 0; i < links.length; i++)
			{
				var link = links[i];
				if (link.href.match(/\.css$/i) && link.rel.match(/stylesheet/i))
				{
					var xhr = $.ajax(link.href, { async: false });
					this._addStyle(xhr.responseText);
				}
			}
			var styles = document.head.querySelectorAll('STYLE');
			for (var i = 0; i < styles.length; i++)
			{
				this._addStyle(styles[i].textContent);
			}
		}

		// add extra style sheets
		if (this._css)
		{
			for (var i = 0; i < this._css.length; i++)
			{
				doc.head.appendChild(this._css[i]);
			}
		}
	};
	PrintDocument.prototype._addStyle = function(style)
	{
		var doc = this._getDocument(), es = doc.createElement('style');
		es.textContent = style;
		doc.head.appendChild(es);
	};
})()