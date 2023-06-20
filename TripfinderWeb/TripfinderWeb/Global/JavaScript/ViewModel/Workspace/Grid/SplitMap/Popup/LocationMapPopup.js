(function()
{
	createNamespace("TF.Grid").LocationMapPopup = LocationMapPopup;

	function LocationMapPopup(options)
	{
		TF.Grid.BaseMapPopup.call(this, options);
	}

	LocationMapPopup.prototype = Object.create(TF.Grid.BaseMapPopup.prototype);
	LocationMapPopup.prototype.constructor = LocationMapPopup;

	LocationMapPopup.prototype.getData = function(ids)
	{
		if (!this.options.isDetailView)
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint("fieldtriplocation")),{
				paramData: {
					"@filter": `in(Id,${ids.join(",")})`,
					"@relationships": ""
				},
			});
		}
		else
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint("fieldtriplocation")),{
				paramData: {
					"@filter": `in(Id,${ids.join(",")})`,
				}
			});
		}
	}

	LocationMapPopup.prototype.buildTitle = function(data)
	{
		return data.Name
	};

	LocationMapPopup.prototype.buildContentMain = function(data)
	{
		const streetContent = data.Street ? `<div class='ellipsis'>${data.Street}</div>` : "";
		const cityStateContent = [data.City, data.State].filter(item => !!item).join(", ");
		let cityStateZipContent = [cityStateContent, data.Zip].filter(item => !!item).join(" ");
		if (cityStateZipContent)
		{
			cityStateZipContent = `<div class='ellipsis'>${cityStateZipContent}</div>`;
		}
		return `${streetContent}${cityStateZipContent}`;
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
		// TODO: refine code to get rid of hard code
		const html = this.createNotesTabHtml("Location", data.Notes || "", "filedtriplocation");
		return html;
	}
})();