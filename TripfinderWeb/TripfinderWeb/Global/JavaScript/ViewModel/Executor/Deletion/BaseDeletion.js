(function()
{
	createNamespace("TF.Executor").BaseDeletion = BaseDeletion;
	function BaseDeletion()
	{
		this.ids = [];
		this.deleteIds = [];
		this.disable = false;
	}

	BaseDeletion.prototype.execute = function(ids)
	{
		if (ids.length === 0)
		{
			return Promise.resolve();
		}
		if (ids.length === 1)
		{
			return this.deleteSingle(ids);
		} else
		{
			return this.deleteMultiple(ids);
		}
	};

	BaseDeletion.prototype.deleteMultiple = function(ids)
	{
		this.ids = ids;
		return this.deleteSinglePermission()
		.then(function(result)
		{
			if (result)
			{
				return this.deleteMultipleVerify();
			}
		}.bind(this))
		.then(function(result)
		{
			if (result)
			{
				return this.deleteSingleAssociatedVerify()
			}
		}.bind(this))
		.then(function()
		{
			return this.deleteConfirm();
		}.bind(this))
		.then(function()
		{
			return this.deleteSelectedItems();
		}.bind(this));
	};

	BaseDeletion.prototype.deleteSingle = function(id)
	{
		this.ids = $.isNumeric(id) ? [id] : id;
		return this.deleteSinglePermission()
		.then(function(result)
		{
			if (result)
			{
				return this.deleteSingleVerify();
			}
		}.bind(this))
		.then(function(result)
		{
			if (result)
			{
				return this.deleteSingleAssociatedVerify()
			}
		}.bind(this))
		.then(function(response)
		{
			if (response)
			{
				if (response.length > 0)
				{
					var confirmMessage = "The selected record is locked or is associated with one or more data types that are locked (" + response.join(",") + "). This record can not be deleted.";
					tf.promiseBootbox.alert(confirmMessage, "Warning");
				}
				else
				{
					this.deleteIds = this.ids;
				}
			}
			return this.deleteConfirm();
		}.bind(this))
		.then(function()
		{
			return this.deleteSelectedItems();
		}.bind(this));
	};

	BaseDeletion.prototype.getEntityStatus = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), this.type, 'entitystatus') + '?' + $.param({ ids: this.ids }));
	};

	BaseDeletion.prototype.deleteSingleVerify = function()
	{
		return this.getEntityStatus().then(function(response)
		{
			if (response.Items[0].Status === 'Locked')
			{
				return tf.promiseBootbox.alert(i18n.t('deletion.single_lock'), "Warning");
			} else
			{
				this.deleteIds = this.ids;
			}
		}.bind(this));
	};

	BaseDeletion.prototype.deleteSingleAssociatedVerify = function()
	{
		return this.getAssociatedVerify(this.ids)
		.then(function(response)
		{
			var associatedItems = response.filter(function(item) { return item.items.length > 0; });
			if (associatedItems.length > 0)
			{
				var confirmMessage = "There is " + i18n.t('entitytype.' + associatedItems[0].type) + " associated with the selected record. This record can not be deleted.";
				return tf.promiseBootbox.alert(confirmMessage, "Cannot Delete Record");
			}
			return true;
		}.bind(this));
	}

	BaseDeletion.prototype.deleteSinglePermission = function()
	{
		return this.getEntityPermissions(this.ids)
		.then(function(response)
		{
			if (response.length > 0)
			{
				var confirmMessage = "The selected record is associated with one or more data types that you do not have permission to delete (" + response.join(",") + "). This record can not be deleted.";
				return tf.promiseBootbox.alert(confirmMessage, "Cannot Delete Record");
			}
			return true;
		}.bind(this));
	};

	BaseDeletion.prototype.deleteMultipleVerify = function()
	{
		return this.getEntityStatus().then(function(response)
		{
			var items = response.Items,
				allCount = this.ids.length;
			var lockedCount = items.filter(function(item)
			{
				return item.Status === 'Locked';
			}).length;
			var unLockedIds = items.filter(function(item)
			{
				return item.Status !== 'Locked';
			}).map(function(item) { return item.Id; });

			if (lockedCount === allCount)
			{
				return tf.promiseBootbox.alert(i18n.t('deletion.multiple_all_lock', { count: allCount.toString() }));
			}
			if (lockedCount > 0 && lockedCount < allCount)
			{
				return tf.promiseBootbox.yesNo(i18n.t('deletion.multiple_lock', { count: lockedCount.toString(), total: allCount }))
				.then(function(ans)
				{
					if (ans)
					{
						this.deleteIds = unLockedIds;
					}
				}.bind(this));
			};
			this.deleteIds = unLockedIds;
		}.bind(this));
	};

	BaseDeletion.prototype.deleteConfirm = function()
	{
		if (this.deleteIds.length === 0)
		{
			return;
		}
		var singleOrMultiple = this.deleteIds.length > 1 ? 'multiple' : 'single';
		return this.getAssociatedData(this.deleteIds).then(function(response)
		{
			//build confirm message
			var associatedItems = response.filter(function(item)
			{
				return item.items && (item.items.length > 0);
			});
			var associatedRecordTypes = '', associatedRecordTypesArray = associatedItems.map(function(item)
			{
				return item.items.length + ' ' + (item.items.length > 1 ?
					tf.applicationTerm.getApplicationTermPluralByName(i18n.t('entitytype.' + item.type)) :
					tf.applicationTerm.getApplicationTermSingularByName(i18n.t('entitytype.' + item.type)));
			}),
				associatedConfirm = '',
				confirmMessage = '';
			if (associatedItems.length > 0)
			{
				if (associatedItems.length > 1)
				{
					$.each(associatedRecordTypesArray, function(index, item)
					{
						if (index === 0)
						{
							associatedRecordTypes += item;
						}
						else if (index === associatedRecordTypesArray.length - 1)
						{
							associatedRecordTypes += ' and ' + item;
						}
						else
						{
							associatedRecordTypes += ' ,' + item;
						}
					})
				}
				else
				{
					associatedRecordTypes = associatedRecordTypesArray.join(',');
				}
				associatedConfirm = i18n.t('deletion.confirm_associated_' + singleOrMultiple, { associatedRecordTypes: associatedRecordTypes });
			}
			confirmMessage = i18n.t('deletion.confirm_' + singleOrMultiple, {
				count: this.deleteIds.length.toString(),
				recordType: i18n.t('entitytype.' + this.type),
				confirmAssociated: associatedConfirm
			});
			if (this.disable)
			{
				return tf.promiseBootbox.alert(i18n.t('deletion.alert_associated_' + singleOrMultiple, { associatedRecordTypes: associatedRecordTypes }))
					.then(function()
					{
						//if related with entities,can not excute deletion
						this.deleteIds = [];
					}.bind(this));
			}
			return tf.promiseBootbox.yesNo(confirmMessage, "Delete Confirmation")
			.then(function(ans)
			{
				//if confirm no , delete nothing
				if (!ans)
				{
					this.deleteIds = [];
				}
			}.bind(this));
		}.bind(this));
	};

	BaseDeletion.prototype.deleteSelectedItems = function()
	{
		if (this.deleteIds.length === 0)
		{
			return;
		}
		var ids = this.deleteIds,
			singleOrMultiple = ids.length > 1 ? 'multiple' : 'single',
			successMessage = (this.deleteIds.length == 1 ? "Record was" : "Records were") + " successfully deleted.",
			errorMessage = i18n.t('deletion.delete_failed_' + singleOrMultiple),
			requestData = ids;
		if ($.isFunction(this.getDeletionData))
		{
			requestData = this.getDeletionData();
		}
		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), this.type), {
			data: requestData
		})
		.then(function()
		{
			tf.promiseBootbox.alert(successMessage, (this.deleteIds.length == 1 ? "Record" : "Records") + " Deleted").then(function()
			{
				if (!this.noNeedRefresh)
				{
					PubSub.publish(topicCombine(pb.DATA_CHANGE, this.type, pb.DELETE), ids);
				}
			}.bind(this));
			return ids;
		}.bind(this))
		.catch(function()
		{
			tf.promiseBootbox.alert(errorMessage);
		}.bind(this));
	};

	BaseDeletion.prototype.getAssociatedData = function()
	{
		return Promise.resolve([]);
	};

	BaseDeletion.prototype.getEntityPermissions = function()
	{
		return Promise.resolve([]);
	};

	BaseDeletion.prototype.getAssociatedVerify = function()
	{
		return Promise.resolve([]);
	};

	BaseDeletion.prototype.getDataPermission = function(ids, associatedDataType, curType)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), associatedDataType, "ids", curType), {
			data: ids
		}).then(function(response)
		{
			if (response.Items && response.Items.length > 0 && response.Items[0].length > 0)
			{
				if (!tf.authManager.isAuthorizedFor(associatedDataType, 'delete'))
				{
					this.associatedDatas.push(associatedDataType);
				}
			}
		}.bind(this));
	}

	BaseDeletion.prototype.getDataStatus = function(ids, associatedDataType, curType)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), associatedDataType, "ids", curType), {
			data: ids
		}).then(function(response)
		{
			if (response.Items && response.Items.length > 0 && response.Items[0].length > 0)
			{
				if (associatedDataType == "staff" && response.Items[0].length == 1 && response.Items[0][0] == 0)
				{// this should change api side error sooner
					return;
				}
				if (associatedDataType == "attendance")
					return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), associatedDataType, 'postentitystatus'), {
						data: response.Items[0]
					});
				else return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), associatedDataType, 'entitystatus') + '?' + $.param({ ids: response.Items[0] }));
			}
		}.bind(this))
		.then(function(response)
		{
			if (response && response.Items)
			{
				response.Items.some(function(item)
				{
					if (item.Status === 'Locked')
					{
						this.associatedDatas.push(associatedDataType);
						return true;
					}
				}.bind(this));
			}
		}.bind(this));
	};
})();
