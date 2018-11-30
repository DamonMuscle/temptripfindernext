(function()
{
	createNamespace('TF.Control').MessageViewModel = MessageViewModel;

	function MessageViewModel(modalViewModel, messageSettings)
	{
		var self = this;
		self.modalViewModel = modalViewModel;
		self.messageSettings = messageSettings;
		self.$element = null;
	}

	MessageViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	MessageViewModel.prototype.constructor = MessageViewModel;

	MessageViewModel.prototype.init = function(model, element)
	{
		var self = this;
		self.$element = $(element);
		if (!self.messageSettings.EnglishMessage || !self.messageSettings.SpanishMessage)
		{
			self.modalViewModel.obOtherButtonLabel("");
			self.$element.find(".language-options").hide();

			if (!self.messageSettings.EnglishMessage)
			{
				self.$element.find(".content").html(self.messageSettings.SpanishMessage);
				tf.storageManager.save("messageLanguage", "spanish");
			}
			else
			{
				self.$element.find(".content").html(self.messageSettings.EnglishMessage);
				tf.storageManager.save("messageLanguage", "english");
			}
		}
		else
		{
			var isEnglish = tf.storageManager.get("messageLanguage") === "english" || !tf.storageManager.get("messageLanguage");
			self.modalViewModel.obOtherButtonLabel(isEnglish ? "Español" : "English");
			self.$element.find(".option").removeClass("selected");
			self.$element.find(".option" + (isEnglish ? ".english" : ".spanish")).addClass("selected");

			self.$element.find(".content").html(isEnglish ? self.messageSettings.EnglishMessage : self.messageSettings.SpanishMessage);
		}
	};

	MessageViewModel.prototype.changeOption = function(viewModel, e)
	{
		var self = this, $option = $(e.target).closest(".option");

		tf.storageManager.save("messageLanguage", $option.hasClass("english") ? "english" : "spanish").then(function()
		{
			self.$element.find(".option").removeClass("selected");
			$option.addClass("selected");
			self.$element.find(".content").html($option.hasClass("english") ? self.messageSettings.EnglishMessage : self.messageSettings.SpanishMessage);
		});
	};

	MessageViewModel.prototype.changeLanguage = function()
	{
		var self = this, isCurrentEnglish = self.modalViewModel.obOtherButtonLabel() === "English";

		tf.storageManager.save("messageLanguage", isCurrentEnglish ? "english" : "spanish").then(function()
		{
			self.modalViewModel.obOtherButtonLabel(isCurrentEnglish ? "Español" : "English");
			self.$element.find(".content").html(isCurrentEnglish ? self.messageSettings.EnglishMessage : self.messageSettings.SpanishMessage);
		});
	};

	MessageViewModel.prototype.dispose = function()
	{
	};
})();
