(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").EditableFieldGroupBlock = EditableFieldGroupBlock;

	var DEFAULT_EDIT_TYPES = {
		TEXT_INPUT: "GroupString",
		DROP_DOWN: "GroupDropDown"
	};

	function EditableFieldGroupBlock(options, dataBlockStyles, currentWidth, detailView)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.options = options;
		self.dataBlockStyles = dataBlockStyles;
		self.currentWidth = currentWidth;
		self.className = options.className;
		self.innerFields = Array.isArray(options.innerFields) ? options.innerFields : [];

		self.defaultData = {};
		self.innerFields.forEach(item =>
		{
			self.defaultData[item.field] = item.defaultValue;
		});

		self.detailViewHelper = tf.helpers.detailViewHelper;
		self.fieldEditorHelper = detailView.fieldEditorHelper;
		self.dataType = detailView.gridType;

		self.uniqueClassName = options.uniqueClassName || self.detailViewHelper.generateUniqueClassName();
		self.obEditing = detailView.obEditing;
		self.isCreateGridNewRecord = detailView.isCreateGridNewRecord;
		self.entity = detailView.recordEntity;
	};

	EditableFieldGroupBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	EditableFieldGroupBlock.prototype.init = function(options)
	{
		var self = this,
			$element = self.createBlockElement(options);

		self.customizeBlockElement($element);

		self.$el = $element;
	};

	/**
	 * Create the data block element.
	 *
	 * @returns
	 */
	EditableFieldGroupBlock.prototype.createBlockElement = function()
	{
		var self = this,
			options = self.options,
			rowCount = options.rowCount,
			dataBlockStyles = self.dataBlockStyles,
			editModeClass = self.isReadMode() ? "" : "temp-edit",
			title = (options.customizedTitle || options.title),
			$element = $("<div/>", {
				class: ["editable-field-group-stack-item", self.uniqueClassName].join(" ")
			}),
			$content = $("<div/>", {
				class: ["grid-stack-item-content", "editable", "multi-editable", self.className].join(" ")
			}).css({
				background: dataBlockStyles.backgroundColor,
				borderColor: dataBlockStyles.borderColor,
			}),
			$titleInput = $("<input/>", {
				class: "item-title"
			}).css({
				color: dataBlockStyles.titleColor,
				value: title
			}),
			$titleLabel = $("<div/>", {
				class: "item-title",
				text: title
			}).css({ color: dataBlockStyles.titleColor }),
			$itemContent = $("<div/>", {
				class: ["item-content", editModeClass].join(" ")
			}).css({ color: dataBlockStyles.contentColor });

		$content.append($titleInput, $titleLabel, $itemContent);
		$element.append($content);

		for (var i = 0; i < rowCount; i++)
		{
			var $row = $("<div/>", { class: "editable-field-group-row" });
			$itemContent.append($row);
		}

		return $element;
	};

	/**
	 * Create text element for each field.
	 *
	 * @param {String} title
	 * @param {String} text
	 * @returns
	 */
	EditableFieldGroupBlock.prototype.createTextFieldElement = function(item, value)
	{
		var dataBlockStyles = this.dataBlockStyles,
			$fieldContainer = $("<div/>", {
				class: "editable-field-container",
				"data-block-field-name": item.field
			}),
			$title = $("<div/>", {
				class: "editable-field-title",
				text: item.title
			}).css({ color: dataBlockStyles.titleColor }),
			$valueLabel = $("<div/>", {
				class: "editable-field-value",
				"data-placeholder": "None",
				text: value
			}).css({ color: dataBlockStyles.contentColor });

		$fieldContainer.append($title, $valueLabel);

		$fieldContainer.addClass(item.class);

		if (item.editType)
		{
			this.customizeEditTypeData(item.editType);

			$fieldContainer.data(item);
			$fieldContainer.addClass("editable");
		}

		return $fieldContainer;
	};

	/**
	 * Generate essential edit type data by type.
	 *
	 * @param {String} editType
	 * @param {Function} getSource
	 * @returns
	 */
	EditableFieldGroupBlock.prototype.customizeEditTypeData = function(editType)
	{
		switch (editType.format.toLowerCase())
		{
			case "string":
				editType.format = DEFAULT_EDIT_TYPES.TEXT_INPUT;
				break;
			case "dropdown":
				editType.format = DEFAULT_EDIT_TYPES.DROP_DOWN;
				break;
			default:
				break;
		}
	};

	/**
	 * Customization on element.
	 *
	 * @param {JQuery} $element
	 */
	EditableFieldGroupBlock.prototype.customizeBlockElement = function($element) { };

	/**
	 * Initialize events.
	 *
	 */
	EditableFieldGroupBlock.prototype.initEvents = function() { };

	/**
	 * Dispose the block.
	 *
	 */
	EditableFieldGroupBlock.prototype.dispose = function() { };
})();