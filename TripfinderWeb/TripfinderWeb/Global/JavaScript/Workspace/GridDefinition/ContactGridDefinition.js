(function()
{
	createNamespace("TF.GridDefinition").ContactGridDefinition = ContactGridDefinition;
	function ContactGridDefinition()
	{

	}

	ContactGridDefinition.prototype.gridDefinition = function(Type)
	{
		var columns = [
			{
				FieldName: "FirstName",
				DisplayName: "First Name",
				type: "string",
				Width: '300px'
			},
			{
				FieldName: "LastName",
				DisplayName: "Last Name",
				type: "string",
				Width: '300px'
			},
			{
				FieldName: "LocalID",
				DisplayName: "Local ID",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "Title",
				DisplayName: "Title",
				type: "string",
				Width: '300px'
			},
			{
				FieldName: "Email",
				DisplayName: "Email",
				type: "string",
				Width: '300px'
			},
			{
				FieldName: "Phone",
				DisplayName: "Phone",
				type: "string",
				Width: '300px',
				formatType: "phone",
				template: function(item)
				{
					return tf.dataFormatHelper.phoneFormatter(item.Phone) || '';
				}
			},
			{
				FieldName: "Ext",
				DisplayName: "Ext",
				type: "string",
				Width: '300px'
			},
			{
				FieldName: "Mobile",
				DisplayName: "Mobile Phone",
				type: "string",
				Width: '300px',
				formatType: "phone",
				template: function(item)
				{
					return tf.dataFormatHelper.phoneFormatter(item.Mobile) || '';
				}
			},
			{
				FieldName: "Fax",
				DisplayName: "Fax",
				type: "string",
				Width: '300px',
				formatType: "phone",
				template: function(item)
				{
					return tf.dataFormatHelper.phoneFormatter(item.Fax) || '';
				}
			},
			{
				FieldName: "DocumentCount",
				DisplayName: "# Documents",
				Width: '150px',
				type: "integer"
			},
			{
				FieldName: "Street1",
				DisplayName: "Mail Street 1",
				type: "string",
				Width: '300px'
			},
			{
				FieldName: "Street2",
				DisplayName: "Mail Street 2",
				type: "string",
				Width: '300px'
			},
			{
				FieldName: "City",
				DisplayName: "Mail City",
				type: "string",
				Width: '300px',
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "contact", "City")
			},
			{
				FieldName: "State",
				DisplayName: "Mail State/Province",
				type: "string",
				Width: '300px',
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "contact", "State")
			},
			{
				FieldName: "Zip",
				DisplayName: "Mail Postal Code",
				type: "string",
				Width: '300px'
			},
			{
				FieldName: "Notes",
				DisplayName: "Notes",
				type: "string",
				Width: '500px'
			}
		];

		if (Type === "contactinformation")
		{
			columns = columns.concat([{
				FieldName: "ContactType",
				DisplayName: "Contact Type",
				type: "string",
				Width: '200px'
			}])

			columns = columns.concat([{
				FieldName: "Name",
				DisplayName: "Name",
				Width: '300px',
				type: "string"
			}])
		}
		else
		{
			columns = columns.concat([{
				FieldName: "AssociationCount",
				DisplayName: "# Associated Records",
				type: "integer",
				Width: '180px'
			}])

			columns = columns.concat([{
				FieldName: "FullName",
				DisplayName: "Name",
				Width: '300px',
				type: "string"
			}])
		}

		return {
			Columns: columns.concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("contact")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("contact")
		};
	}

	tf.contactGridDefinition = new TF.GridDefinition.ContactGridDefinition();
})();
