(function()
{
	createNamespace("TF.Grid").LocationMapPopup = LocationMapPopup;

	function LocationMapPopup(options)
	{
		TF.Grid.BaseMapPopup.call(this, options);
	}

	LocationMapPopup.prototype = Object.create(TF.Grid.BaseMapPopup.prototype);
	LocationMapPopup.prototype.constructor = LocationMapPopup;

	LocationMapPopup.prototype.buildContent = function(graphics)
	{
		return TF.Grid.BaseMapPopup.prototype.buildContent.call(this, (graphics || []).map(x=>x.attributes));
	};

	LocationMapPopup.prototype.buildTitle = function(data)
	{
		return data.Name
	};

	LocationMapPopup.prototype.buildContentMain = function(data)
	{
		return `<div>${data.Street || ""}</div>
				<div>
					<span>${data.City}</span>
					<span>${data.State}</span>
					<span>${data.Zip}</span>
				</div>`
	};

	LocationMapPopup.prototype.buildContentExtend = function(data)
	{
		return [{
				name: "Notes",
				content: this.createNoteHtml(data)
			}];
	}

	LocationMapPopup.prototype.createNoteHtml = function(data)
	{
		return `<div>
					Notes
					<div>
						${data.Notes || ""}
					</div>
				</div>`;
	}
})();