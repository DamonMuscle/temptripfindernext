(function()
{
	createNamespace("TF.GridDefinition").CommunicationHistoryGridDefinition = CommunicationHistoryGridDefinition;

	function CommunicationHistoryGridDefinition() { }

	CommunicationHistoryGridDefinition.prototype.gridDefinition = function()
	{
		function utc2Local(value)
		{
			const dt = utcToClientTimeZone(value);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		}

		function formatDateTimeField(field)
		{
			var dt = moment(field);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		}

		return {
			Columns: [
				{
					FieldName: "Name",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "RecipientEmail",
					DisplayName: "Recipient",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "SentOn",
					DisplayName: "Sent On",
					Width: '150px',
					type: "datetime",
					template: function(item)
					{
						let dt = utcToClientTimeZone(item["SentOn"]);
						return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
					},
					hidden: false,
					isUTC: true,
				},
				{
					FieldName: "Subject",
					DisplayName: "Subject",
					Width: '150px',
					type: "string",
					hidden: false,
				},
				{
					FieldName: "BodyText",
					DisplayName: "Body",
					Width: '150px',
					type: "string",
					hidden: false,
				},
				{
					FieldName: "SentAs",
					DisplayName: "Sent As",
					Width: '80px',
					type: "string",
					hidden: false,
				},
				{
					FieldName: "LoginID",
					DisplayName: "Sent By",
					Width: '100px',
					type: "string",
					hidden: false,
				},
			]
		};
	};

	tf.communicationHistoryGridDefinition = new TF.GridDefinition.CommunicationHistoryGridDefinition();
})();
