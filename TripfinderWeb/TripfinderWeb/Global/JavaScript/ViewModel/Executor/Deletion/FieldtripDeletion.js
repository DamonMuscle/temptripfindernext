(function()
{
	var namespace = createNamespace("TF.Executor");

	namespace.FieldtripDeletion = FieldtripDeletion;

	function FieldtripDeletion()
	{
		this.type = 'fieldtrip';
		namespace.BaseDeletion.apply(this, arguments);
	}

	FieldtripDeletion.prototype = Object.create(namespace.BaseDeletion.prototype);
	FieldtripDeletion.prototype.constructor = FieldtripDeletion;

	FieldtripDeletion.prototype.getAssociatedData = function(ids)
	{
		var associatedDatas = [];

		var p0 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtriphistory", "ids", "fieldtrip"), {
			data: ids
		}).then(function(response)
		{
			associatedDatas.push({
				type: 'fieldtriphistory',
				items: response.Items[0]
			});
		});

		var p1 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtripinvoice", "ids", "fieldtrip"), {
			data: ids
		}).then(function(response)
		{
			associatedDatas.push({
				type: 'fieldtripinvoice',
				items: response.Items[0]
			});
		});

		var p2 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtripresourcegroup", "fieldtripresources", "ids"), {
			data: ids
		}).then(function(response)
		{
			var resources = response.Items;
			var drivers = { type: 'driver', items: [] }, vehicles = { type: 'vehicle', items: [] }, busAides = { type: 'busaide', items: [] };
			if (resources && resources.length > 0)
			{
				$.each(resources, function(index, resource)
				{
					if (resource.DriverId > 0)
					{
						drivers.items.push(resource.DriverId);
					}
					if (resource.VehicleId > 0)
					{
						vehicles.items.push(resource.VehicleId);
					}
					if (resource.AideId > 0)
					{
						busAides.items.push(resource.AideId);
					}
				});

				associatedDatas.push(drivers);
				associatedDatas.push(vehicles);
				associatedDatas.push(busAides);
			}
		});

		return Promise.all([p0, p1, p2]).then(function()
		{
			return associatedDatas;
		});
	}

	FieldtripDeletion.prototype.getEntityPermissions = function(ids)
	{
		this.associatedDatas = [];

		if (!tf.authManager.isAuthorizedFor(this.type, 'delete'))
		{
			this.associatedDatas.push(this.type);
		}

		var p0 = this.getDataPermission(ids, "fieldtriphistory", "fieldtrip");
		var p1 = this.getDataPermission(ids, "fieldtripinvoice", "fieldtrip");

		return Promise.all([p0, p1]).then(function()
		{
			return this.associatedDatas;
		}.bind(this));
	}


	FieldtripDeletion.prototype.deleteSingleVerify = function()
	{
		this.associatedDatas = [];

		var p0 = this.getEntityStatus().then(function(response)
		{
			if (response.Items[0].Status === 'Locked')
			{
				this.associatedDatas.push(this.type);
			}
		}.bind(this));

		var p1 = this.getDataStatus(this.ids, "fieldtriphistory", "fieldtrip");

		var p2 = this.getDataStatus(this.ids, "fieldtripinvoice", "fieldtrip");

		return Promise.all([p0, p1, p2]).then(function()
		{
			return this.associatedDatas;
		}.bind(this));

	};
})();