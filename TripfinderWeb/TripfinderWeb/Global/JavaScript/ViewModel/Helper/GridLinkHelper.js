(function()
{
	createNamespace("TF.Helper").GridLinkHelper = GridLinkHelper;

	function GridLinkHelper()
	{
		this.endpoint = "gridlinks";
	}

	GridLinkHelper.prototype.getGridLink = function(guid)
	{
		return tf.promiseAjax.get(
			pathCombine(tf.api.apiPrefixWithoutDatabase(), this.endpoint),
			{
				paramData: {
					"@fields": "Ids,DBID,DataTypeId,Layout,ThematicSetting,AdditionalInfo",
					"@filter": `eq(GUID,${guid})`
				}
			}).then((data) =>
			{
				if (Array.isArray(data.Items) && data.Items.length > 0)
				{
					const gridLink = data.Items[0];

					return this.verifyGridLinkAccess(gridLink)
						.then((isValid) =>
						{
							gridLink.isAuthorized = isValid;
							return gridLink;
						});
				}
			});
	};

	GridLinkHelper.prototype.verifyGridLinkAccess = function(gridLink)
	{
		const requiredSecuredRight = 'read';
		const dataTypeAccess = tf.authManager.authorizationInfo.isAdmin
			|| tf.authManager.isAuthorizedForDataType(tf.dataTypeHelper.getKeyById(gridLink.DataTypeId), requiredSecuredRight);

		return dataTypeAccess ? tf.datasourceManager.verifyDatabase(gridLink.DBID) : Promise.resolve(false);
	};

	GridLinkHelper.prototype.createGridLink = function(dbid, type, ids, columns, thematicSetting, additionalInfo)
	{
		const gridLink = {
			DBID: dbid,
			DataTypeId: tf.dataTypeHelper.getId(type),
			Ids: ids.join(),
			Layout: JSON.stringify(columns),
			ThematicSetting: thematicSetting && JSON.stringify(thematicSetting),
			AdditionalInfo: additionalInfo && JSON.stringify(additionalInfo),
		};
		return tf.promiseAjax.post(
			pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlinks"), { data: [gridLink] })
			.then((data) =>
			{
				if (Array.isArray(data.Items) && data.Items.length > 0)
				{
					const gridLink = data.Items[0];
					gridLink.isAuthorized = true;

					return gridLink;
				}
			});
	};
})();
