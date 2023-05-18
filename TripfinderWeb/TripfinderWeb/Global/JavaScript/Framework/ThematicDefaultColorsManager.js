(function()
{
	createNamespace("TF").ThematicDefaultColorsManager = ThematicDefaultColorsManager;
	function ThematicDefaultColorsManager()
	{
		var self = this;
		self.thematicDefaultColors = null;
	}

	/**
	 * Gets the array of thematic default colors.
	 * @returns {Array} The array of thematic default colors.
	 */
	ThematicDefaultColorsManager.prototype.getThematicDefaultColors = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "thematicdefaultcolors"))
			.then(function(response)
			{
				if (response.Items)
				{
					self.thematicDefaultColors = response.Items;
				}
			}.bind(self));
	}
})();