(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").AddressBlock = AddressBlock;

	var ROW_COUNT = 2;

	function AddressBlock(options, dataBlockStyles, currentWidth, detailView)
	{
		var self = this;

		options.rowCount = ROW_COUNT;
		options.minWidth = currentWidth > 1 ? 2 : 1;

		TF.DetailView.DataBlockComponent.EditableFieldGroupBlock.call(self, options, dataBlockStyles, currentWidth, detailView);

		self.init(options);
	}

	AddressBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.EditableFieldGroupBlock.prototype);

	/**
	 * Customization on element.
	 *
	 * @param {JQuery} $element
	 */
	AddressBlock.prototype.customizeBlockElement = function($element)
	{
		var self = this,
			entity = self.entity,
			geoData = self.prepareData(entity),
			$stack = $element.find(".grid-stack-item-content"),
			$item = $stack.find(".item-content"),
			$copyAddressBtn = $("<div/>", { class: "copy-address-btn", text: "Copy From Mailing" });

		$stack.addClass("address-stack-item");
		$item.addClass("address-content");

		$element.find("div.item-title").append($copyAddressBtn);

		if (self.isReadOnly())
		{
			$copyAddressBtn.addClass("disabled");
		}

		var rowElements = $item.find(".editable-field-group-row");

		self.innerFields.forEach(item =>
		{
			var fieldValue = geoData[item.field],
				$field = self.createTextFieldElement(item, fieldValue);

			$(rowElements[item.row - 1]).append($field);
		});
	};

	/**
	 * Prepare required geo data.
	 *
	 * @param {Object} entity
	 * @returns
	 */
	AddressBlock.prototype.prepareData = function(entity)
	{
		var self = this,
			geoStreet = geoZip = geoCity = geoConfidence = "None";

		if (self.isReadMode())
		{
			if (!self.isCreateGridNewRecord && entity)
			{
				if (entity.GeoStreet)
				{
					geoStreet = entity.GeoStreet;
				}

				if (entity.GeoZip)
				{
					geoZip = entity.GeoZip;
				}

				if (entity.GeoCity)
				{
					geoCity = entity.GeoCity;
				}

				if (entity.GeoConfidence || entity.GeoConfidence === 0)
				{
					geoConfidence = entity.GeoConfidence;
				}
			}
		}
		else
		{
			geoStreet = self.defaultData.GeoStreet;
			geoZip = self.defaultData.GeoZip;
			geoCity = self.defaultData.GeoCity;
			geoConfidence = self.defaultData.GeoConfidence;
		}

		return {
			GeoStreet: geoStreet,
			GeoZip: geoZip,
			GeoCity: geoCity,
			GeoConfidence: geoConfidence
		};
	};

	AddressBlock.prototype.initEvents = function()
	{
		var self = this;
		if (self.isReadMode() && !self.isReadOnly())
		{
			self.$el.on('click', '.copy-address-btn', self.onCopyBtnClick.bind(self));
		}
	};

	AddressBlock.prototype.onCopyBtnClick = function(e)
	{
		var self = this, helper = self.fieldEditorHelper;;

		if (self.isCreateGridNewRecord) return;

		e.stopPropagation();

		var copyGeoAddressFields = function(sourceFieldName, targetFieldName, title)
		{
			var sourceValue;
			if (helper.editFieldList[sourceFieldName])
			{
				sourceValue = helper.editFieldList[sourceFieldName].value;
			} else
			{
				sourceValue = self.entity[sourceFieldName];
			}
			updateGeoAddressFields(sourceValue || 'None', targetFieldName, title);
		};

		var copyGeoAddressFieldsFromDropDownList = function(sourceFieldName, targetFieldName, title)
		{
			var sourceFiled = Object.values(helper.editFieldList).find(function(field)
			{
				return field.blockName === sourceFieldName;
			});

			var sourceValue = sourceFiled ? sourceFiled.textValue : self.entity[sourceFieldName];

			updateGeoAddressFields(sourceValue || 'None', targetFieldName, title);
		}

		var updateGeoAddressFields = function(sourceValue, targetFieldName, title)
		{
			var $relatedFieldContents = self.$el.find(`.editable-field-container[data-block-field-name='${targetFieldName}'] .editable-field-value`);

			if (sourceValue !== $relatedFieldContents.text())
			{
				helper.editFieldList[targetFieldName] = {
					value: sourceValue,
					blockName: targetFieldName,
					title: title
				};
				helper._updateGeneralFieldsContent(targetFieldName, sourceValue, { updateAll: true });
				$relatedFieldContents.text(sourceValue);

				self.obEditing(true);
			}
		}
		copyGeoAddressFields("MailStreet1", "GeoStreet", "GeoCode Address Street");
		copyGeoAddressFieldsFromDropDownList("MailCity", "GeoCity", "GeoCode Address City/Town");
		copyGeoAddressFieldsFromDropDownList("MailZip", "GeoZip", "GeoCode Address Postal Code");
	};

	AddressBlock.prototype.fetchDropDownDataSource = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "mailingpostalcodes?@fields=Id,Postal"))
			.then(result =>
			{
				return result.Items.map(item =>
				{
					return {
						text: item["Postal"],
						value: item["Id"]
					};
				});
			});
	};

	AddressBlock.prototype.fetchGeoCityTown = function()
	{

	};

	AddressBlock.prototype.dispose = function()
	{
		this.$el.off('click');
	};
})();