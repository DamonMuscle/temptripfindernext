(function()
{
	createNamespace("TF.GridDefinition").ContactGridDefinition = ContactGridDefinition;
	function ContactGridDefinition()
	{

	}

	ContactGridDefinition.prototype.gridDefinition = function(gridType)
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
				template: function(item)
				{
					return tf.dataFormatHelper.phoneFormatter(item.Fax) || '';
				}
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
				Width: '300px'
			},
			{
				FieldName: "State",
				DisplayName: "Mail State/Province",
				type: "string",
				Width: '300px'
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

		return {
			Columns: columns.concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("contact")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("contact")
		};
	}

	tf.contactGridDefinition = new TF.GridDefinition.ContactGridDefinition();
})();
