(function () {
	var namespace = window.createNamespace("TF.Input");
	namespace.PhoneBox = PhoneBox;

	function PhoneBox() {
		namespace.IntegerBox.apply(this, arguments);
		this.getElement().on("keyup", function (e) {
			if (event.which != 37 && event.which != 39) {
				var $input = $(e.target);
				var inputSourceValue = $input.val();
				if (e.keyCode === 8 && inputSourceValue.endsWith(")")) {
					var inputPureValue = tf.dataFormatHelper.getPurePhoneNumber(inputSourceValue);
					inputPureValue = inputPureValue.substring(0, inputPureValue.length - 1);
					inputSourceValue = inputPureValue;
				}
				var rawValue = tf.dataFormatHelper.phoneFormatter(inputSourceValue);
				$input.val(rawValue);
				this.obRawValue(rawValue);
			}
		}.bind(this));
	}

	PhoneBox.prototype = Object.create(namespace.IntegerBox.prototype);

	PhoneBox.constructor = PhoneBox;

	PhoneBox.prototype.type = "Phone";

	PhoneBox.prototype.rawValueChange = function (value) {
		namespace.StringBox.prototype.rawValueChange.call(this, value);
	};

	PhoneBox.prototype.valueChange = function (value) {
		value = tf.dataFormatHelper.phoneFormatter(value);
		namespace.StringBox.prototype.valueChange.call(this, value);
	};
})();
