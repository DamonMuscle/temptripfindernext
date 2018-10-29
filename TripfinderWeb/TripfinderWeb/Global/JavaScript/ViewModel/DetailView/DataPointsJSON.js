var today = (new Date()).toDateString(),
	dataPointsJSON = {
		"altsite": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "After School Program"
				},
				{
					"field": "SiteOwnerName",
					"title": "Site Ownership",
					"type": "String",
					"defaultValue": "Public"
				},
				{
					"field": "Contact",
					"title": "Contact",
					"type": "String",
					"defaultValue": "John Smith"
				},
				{
					"field": "ContactTitle",
					"title": "Title",
					"type": "String",
					"defaultValue": "CEO"
				},
				{
					"field": "PhoneWithExt",
					"title": "Phone/Ext",
					"type": "String",
					"defaultValue": "(800) 373-3609 x01"
				},
				{
					"field": "Comments",
					"title": "Note",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"Address": [
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State St."
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1"
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "MailState",
					"title": "Mailing Address State",
					"type": "String",
					"defaultValue": "NY"
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				},
				{
					"field": "GeoStreet",
					"title": "GeoCode Address Street",
					"type": "String",
					"defaultValue": "440 State St."
				},
				{
					"field": "GeoCity",
					"title": "GeoCode Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "GeoCounty",
					"title": "GeoCode Address Map Set",
					"type": "String"
				},
				{
					"field": "GeoZip",
					"title": "GeoCode Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				}
			],
			"Miscellaneous": [
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				},
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"defaultValue": "Map",
					"min-height": "4"
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			],
			"Grid": [
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"subUrl": "altsite",
					"min-height": "3"
				}
			]
		},
		"contractor": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Joe's Charter Buses"
				},
				{
					"field": "Contact",
					"title": "Contact",
					"type": "String",
					"defaultValue": "John Smith"
				},
				{
					"field": "ContactTitle",
					"title": "Title",
					"type": "String",
					"defaultValue": "Owner"
				},
				{
					"field": "PhoneWithExt",
					"title": "Phone/Ext",
					"type": "String",
					"defaultValue": "(800) 373-3609 x01"
				},
				{
					"field": "Email",
					"title": "Email",
					"type": "String",
					"defaultValue": "jsmith@transfinder.com"
				},
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State St."
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1"
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "MailState",
					"title": "Mailing Address State",
					"type": "String",
					"defaultValue": "NY"
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"Miscellaneous": [
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			]
		},
		"district": {
			"Main": [
				{
					"field": "IdString",
					"title": "Code",
					"type": "String",
					"defaultValue": "TSD"
				},
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Transfinder School District"
				},
				{
					"field": "Contact",
					"title": "Contact",
					"type": "String",
					"defaultValue": "John Smith"
				},
				{
					"field": "ContactTitle",
					"title": "Title",
					"type": "String",
					"defaultValue": "Superintendant"
				},
				{
					"field": "PhoneWithExt",
					"title": "Phone/Ext",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State Street"
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1"
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "MailState",
					"title": "Mailing Address State",
					"type": "String",
					"defaultValue": "NY"
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"Miscellaneous": [
				{
					"field": "Calendar",
					"title": "Calendar",
					"type": "Calendar",
					"min-height": "4"
				},
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			]
		},
		"fieldtrip": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Music Department Trip"
				},
				{
					"field": "SchoolNameWithCode",
					"title": "School",
					"type": "String",
					"defaultValue": "Transfinder Elementary School"
				},
				{
					"field": "DistrictDepartmentName",
					"title": "Department",
					"type": "String",
					"defaultValue": "Transfinder School District"
				},
				{
					"field": "FieldTripActivityName",
					"title": "Activity",
					"type": "String",
					"defaultValue": "Field Trip"
				},
				{
					"field": "DeptActivity",
					"title": "Dept./Activity",
					"type": "String",
					"defaultValue": "Music"
				},
				{
					"field": "FieldTripContact",
					"title": "Contact",
					"type": "String",
					"defaultValue": "John Smith"
				},
				{
					"field": "PhoneWithExt",
					"title": "Phone/Ext",
					"type": "String",
					"defaultValue": "(800) 373-3609 x01"
				},
				{
					"field": "ContactEmail",
					"title": "Email",
					"type": "String",
					"defaultValue": "bfonder@transfinder.com"
				},
				{
					"field": "FieldTripClassificationName",
					"title": "Classification",
					"type": "String",
					"defaultValue": "Educational"
				},
				{
					"field": "FieldTripEquipmentName",
					"title": "Equipment",
					"type": "String",
					"defaultValue": "Musical Instruments"
				},
				{
					"field": "NumberOfStudents",
					"title": "#Students",
					"type": "Number",
					"defaultValue": "8"
				},
				{
					"field": "NumberOfAdults",
					"title": "#Adults",
					"type": "Number",
					"defaultValue": "1"
				},
				{
					"field": "NumberOfWheelChairs",
					"title": "#Wheel Chairs",
					"type": "Number",
					"defaultValue": "0"
				},
				{
					"field": "NumberOfVehicles",
					"title": "#Vehicles",
					"type": "Number",
					"defaultValue": "1"
				},
				{
					"field": "EstimatedMiles",
					"title": "Estimated Miles",
					"type": "Number"
				},
				{
					"field": "EstimatedHours",
					"title": "Estimated Hours",
					"type": "Number"
				},
				{
					"field": "EstimatedCost",
					"title": "Estimated Cost($)",
					"type": "Number"
				}
			],
			"Destination": [
				{
					"field": "DepartDateTime",
					"title": "Depart Date/Time",
					"type": "Date/Time",
					"defaultValue": today
				},
				{
					"field": "DepartTime",
					"title": "Depart Time",
					"type": "Time",
					"defaultValue": "12:00"
				},
				{
					"field": "EstimatedReturnDateTime",
					"title": "Return Date/Time",
					"type": "Date/Time",
					"defaultValue": today
				},
				{
					"field": "ReturnTime",
					"title": "Return Time",
					"type": "Time",
					"defaultValue": "18:00"
				},
				{
					"field": "DepartureSchoolNameWithCode",
					"title": "Departure",
					"type": "String",
					"defaultValue": "Transfinder Elementary School"
				},
				{
					"field": "DepartureNotes",
					"title": "Departure Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				},
				{
					"field": "Destination",
					"title": "Destination",
					"type": "String",
					"defaultValue": "Sound Museum"
				},
				{
					"field": "DestinationAddress",
					"title": "Destination Address",
					"type": "String",
					"defaultValue": "440 State Street Schenectady, NY 12305"
				},
				{
					"field": "DestinationContact",
					"title": "Destination Contact",
					"type": "String",
					"defaultValue": "Cornelia C. Contralto II"
				},
				{
					"field": "DestinationContactTitle",
					"title": "Destination Title",
					"type": "String",
					"defaultValue": "Professor"
				},
				{
					"field": "DestinationPhoneWithExt",
					"title": "Destination Phone/Ext",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "DestinationFax",
					"title": "Destination Fax",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "DestinationEmail",
					"title": "Destination Email",
					"type": "String",
					"defaultValue": "ccontralto@soundmuseum.net"
				},
				{
					"field": "DestinationNotes",
					"title": "Destination Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				},
				{
					"field": "DirectionNotes",
					"title": "Directions",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"Billing": [
				{
					"field": "BillingClassificationName",
					"title": "Billing Classification",
					"type": "String",
					"defaultValue": "8"
				},
				{
					"field": "BillingNotes",
					"title": "Billing Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				},
				{
					"field": "InvoicingInformation",
					"title": "Invoicing Information",
					"type": "String",
					"defaultValue": "Account Name: Science / Amount: $2000 / PO: 402934 / Invoice Date: " + today + " / Payment Date " + today
				},
				{
					"field": "TotalAmount",
					"title": "Total amount",
					"type": "Number",
					"format": "Money",
					"defaultValue": "568.50"
				}
			],
			"Grid": [
				{
					"field": "FieldTripHistoryGrid",
					"title": "Field Trip History Grid",
					"type": "grid",
					"url": "fieldtriphistory",
					"subUrl": "fieldtrip",
					"min-height": "3"
				},
				{
					field: "FieldTripResourceGrid",
					title: "Field Trip Resource Grid",
					type: "grid",
					url: "fieldtripresource",
					subUrl: "fieldtrip",
					"min-height": 3
				},
				{
					field: "FieldTripVehicleGrid",
					title: "Field Trip Vehicle Grid",
					type: "grid",
					url: "fieldtripvehicle",
					subUrl: "fieldtrip",
					"min-height": 3
				},
				{
					field: "FieldTripDriverGrid",
					title: "Field Trip Driver Grid",
					type: "grid",
					url: "fieldtripdriver",
					subUrl: "fieldtrip",
					"min-height": 3
				},
				{
					field: "FieldTripAideGridz",
					title: "Field Trip Aide Grid",
					type: "grid",
					url: "fieldtripaide",
					subUrl: "fieldtrip",
					"min-height": 3
				},
				{
					field: "FieldTripInvoiceGrid",
					title: "Field Trip Invoice Grid",
					type: "grid",
					url: "fieldtripinvoice",
					subUrl: "fieldtrip",
					"min-height": 3
				}
			],
			"Miscellaneous": [
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				},
				{
					"field": "Notes",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			]
		},
		"georegion": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Romulan Neutral Zone"
				},
				{
					"field": "GeoregionTypeName",
					"title": "Type",
					"type": "String",
					"defaultValue": "Buffer"
				},
				{
					"field": "HotLink",
					"title": "Hotlink",
					"type": "String",
					"defaultValue": "http://www.startrek.com/database_article/neutral-zone"
				},
				{
					"field": "ContactName",
					"title": "Contact Name",
					"type": "String",
					"defaultValue": "Neral"
				},
				{
					"field": "PhoneWithExt",
					"title": "Contact Phone/Ext",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "ContactEmail",
					"title": "Contact Email",
					"type": "String",
					"defaultValue": "neral@romulanstarempire.gov"
				},
				{
					"field": "StudentCount",
					"title": "Students",
					"type": "Number",
					"defaultValue": "47"
				},
				{
					"field": "SchoolCount",
					"title": "Schools",
					"type": "Number",
					"defaultValue": "1"
				},
				{
					"field": "TripstopsCount",
					"title": "Stops",
					"type": "Number",
					"defaultValue": "12"
				},
				{
					"field": "AltsitesCount",
					"title": "Alt Sites",
					"type": "Number",
					"defaultValue": "2"
				}
			],
			"Address": [
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State Street"
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1"
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "MailState",
					"title": "Mailing Address State",
					"type": "String",
					"defaultValue": "NY"
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				},
				{
					"field": "GeoStreet",
					"title": "GeoCode Address Street",
					"type": "String",
					"defaultValue": "440 State Street"
				},
				{
					"field": "GeoCity",
					"title": "GeoCode Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "GeoCounty",
					"title": "GeoCode Address Map Set",
					"type": "String"
				},
				{
					"field": "GeoZip",
					"title": "GeoCode Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				}
			],
			"Miscellaneous": [
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				},
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			],
			"Grid": [
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "georegion",
					"min-height": "3"
				},
				{
					"field": "AltsiteGrid",
					"title": "Alternate Site Grid",
					"type": "grid",
					"url": "altsite",
					"subUrl": "georegion",
					"min-height": "3"
				},
				{
					"field": "SchoolGrid",
					"title": "School Grid",
					"type": "grid",
					"url": "school",
					"subUrl": "georegion",
					"min-height": "3"
				},
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"subUrl": "georegion",
					"min-height": "3"
				},
				{
					"field": "TripStopGrid",
					"title": "Trip Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"subUrl": "georegion",
					"min-height": "3"
				}
			]
		},
		"school": {
			"Main": [
				{
					"field": "SchoolCode",
					"title": "Code",
					"type": "String",
					"defaultValue": "TES"
				},
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Transfinder Elementary School"
				},
				{
					"field": "DistrictName",
					"title": "District",
					"type": "String",
					"defaultValue": "Transfinder School District"
				},
				{
					"field": "GradeRange",
					"title": "Grades",
					"type": "String",
					"defaultValue": "1-5"
				},
				{
					"field": "SchoolName",
					"title": "Feeding To",
					"type": "String",
					"defaultValue": "Washington Middle School"
				},
				{
					"field": "BeginTime",
					"title": "Begin Time",
					"type": "Time",
					"defaultValue": "08:10"
				},
				{
					"field": "EndTime",
					"title": "End Time",
					"type": "Time",
					"defaultValue": "15:31"
				},
				{
					"field": "ArrivalTime",
					"title": "Arrival Time",
					"type": "Time",
					"defaultValue": "07:30"
				},
				{
					"field": "DepartTime",
					"title": "Departure Time",
					"type": "Time",
					"defaultValue": "15:45"
				},
				{
					"field": "Tschl",
					"title": "Allow Transfers at this School",
					"type": "Boolean",
					"defaultValue": "Yes",
					"displayValue": "Transfers Allowed",
					"positiveLabel": "Transfers Allowed",
					"negativeLabel": "Transfers not Allowed"
				},
				{
					"field": "Private",
					"title": "Private School",
					"type": "Boolean",
					"defaultValue": "Yes",
					"displayValue": "Private School",
					"positiveLabel": "Private School",
					"negativeLabel": "Public School"
				},
				{
					"field": "Contact",
					"title": "Contact",
					"type": "String",
					"defaultValue": "John Smith"
				},
				{
					"field": "ContactTitle",
					"title": "Title",
					"type": "String",
					"defaultValue": "Head Teacher"
				},
				{
					"field": "Phone",
					"title": "Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "FaxWithExt",
					"title": "Fax/Ext",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "Email",
					"title": "Email",
					"type": "String",
					"defaultValue": "wrolnick@transfinder.com"
				},
				{
					"field": "SifimportStudents",
					"title": "Accept Sif Students",
					"type": "Boolean",
					"defaultValue": "true",
					"displayValue": "SIF Students Accepted",
					"positiveLabel": "SIF Students Accepted",
					"negativeLabel": "SIF Students not Accepted"
				},
				{
					"field": "Capacity",
					"title": "Students Capacity",
					"type": "Number",
					"defaultValue": "600"
				},
				{
					"field": "StudentCount",
					"title": "Students Enrolled",
					"type": "Number",
					"defaultValue": "452"
				}
			],
			"Address": [
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State Street"
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1"
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "MailState",
					"title": "Mailing Address State",
					"type": "String",
					"defaultValue": "NY"
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				},
				{
					"field": "GeoStreet",
					"title": "GeoCode Address Street",
					"type": "String",
					"defaultValue": "440 State Street"
				},
				{
					"field": "GeoCity",
					"title": "GeoCode Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "GeoCounty",
					"title": "GeoCode Address Map Set",
					"type": "String"
				},
				{
					"field": "GeoZip",
					"title": "GeoCode Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				}
			],
			"Miscellaneous": [
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				},
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "Calendar",
					"title": "Calendar",
					"type": "Calendar",
					"min-height": "4"
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			],
			"Grid": [
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"subUrl": "school",
					"min-height": "3"
				},
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "tripbyschoolIds",
					"min-height": "3"
				},
				{
					"field": "StopGrid",
					"title": "Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"subUrl": "tripstopbyschoolIds",
					"min-height": "3"
				}
			]
		},
		"staff": {
			"Primary Information": [
				{
					"field": "StaffLocalId",
					"title": "Local ID",
					"type": "Number",
					"defaultValue": "46290"
				},
				{
					"field": "ActiveFlag",
					"title": "Status",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Active",
					"positiveLabel": "Active",
					"negativeLabel": "Inactive"
				},
				{
					"field": "StaffName",
					"title": "Name",
					"type": "String",
					"defaultValue": "John Smith"
				},
				{
					"field": "AllStaffTypes",
					"title": "Type",
					"type": "String",
					"defaultValue": "Driver"
				},
				{
					"field": "EmployeeId",
					"title": "Employee ID",
					"type": "String",
					"defaultValue": "46290"
				},
				{
					"field": "ImageBase64",
					"title": "Picture",
					"type": "RecordPicture",
					"defaultValue": false,
					"min-height": "2"
				}
			],
			"Main": [
				{
					"field": "LicenseNumber",
					"title": "License Number",
					"type": "String",
					"defaultValue": "S967238"
				},
				{
					"field": "LicenseState",
					"title": "License State",
					"type": "String",
					"defaultValue": "NY"
				},
				{
					"field": "LicenseClass",
					"title": "License Class",
					"type": "String",
					"defaultValue": "CDL"
				},
				{
					"field": "LicenseRestrictions",
					"title": "License Restrictions",
					"type": "String",
					"defaultValue": "P, Q"
				},
				{
					"field": "LicenseExpiration",
					"title": "License Expiration",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "LicenseEndorsements",
					"title": "License Endorsements",
					"type": "String",
					"defaultValue": "F, G, H, M, N, P, R, S, T, W, X"
				},
				{
					"field": "HireDate",
					"title": "Date of Hire",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "InactiveDate",
					"title": "Inactive Date",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "Ssn",
					"title": "SSN",
					"type": "String",
					"defaultValue": "123-45-6789"
				},
				{
					"field": "DateOfBirth",
					"title": "Birth Date",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "DisplayGender",
					"title": "Gender",
					"type": "String",
					"defaultValue": "Male"
				},
				{
					"field": "ContractorName",
					"title": "Contractor",
					"type": "String",
					"defaultValue": "Joe's Charter Buses"
				},
				{
					"field": "Rate",
					"title": "Rate",
					"type": "Number",
					"format": "Money",
					"defaultValue": "15.00"
				},
				{
					"field": "Otrate",
					"title": "OT Rate",
					"type": "Number",
					"format": "Money",
					"defaultValue": "22.50"
				}
			],
			"Contact Info": [
				{
					"field": "Mailstreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State Street"
				},
				{
					"field": "Mailstreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1"
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "MailState",
					"title": "Mailing Address State",
					"type": "String",
					"defaultValue": "NY"
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				},
				{
					"field": "HomePhone",
					"title": "Home Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609"
				},
				{
					"field": "WorkPhone",
					"title": "Work Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "CellPhone",
					"title": "Cell Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609"
				},
				{
					"field": "Email",
					"title": "Email Address",
					"type": "String",
					"defaultValue": "tchen@transfinder.com"
				}
			],
			"Requirements": [
				{
					"field": "ApplicationField",
					"title": "Application",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "FingerPrint",
					"title": "Finger Print",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "SuperintendentApprov",
					"title": "Superintendent Approv.",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "NewHireOrient",
					"title": "New Hire Orient",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "Abstract",
					"title": "Abstract",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "Interview",
					"title": "Interview",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "DefensiveDriving",
					"title": "Defensive Driving",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "DrivingTestPractical",
					"title": "Driving Test (Practical)",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "DrivingTestWritten",
					"title": "Driving Test (Written)",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "MedicalExam",
					"title": "Medical Exam",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "PPTField",
					"title": "PPT",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "HepatitisB",
					"title": "Hepatitis B",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "Certification",
					"title": "Certification",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "BasicField",
					"title": "Basic",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "Advanced",
					"title": "Advanced",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "PreService",
					"title": "Pre-Service",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "HandicapPreService",
					"title": "Handicap Pre-Service",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "RefresherPart1",
					"title": "Refresher (Part 1)",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "RefresherPart2",
					"title": "Refresher (Part 2)",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "HandicapRef",
					"title": "Handicap Ref",
					"type": "Date",
					"defaultValue": today
				}
			],
			"Miscellaneous": [
				{
					"field": "Schedule",
					"title": "Schedule",
					"type": "Schedule",
					"min-height": "3"
				},
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			]
		},
		"student": {
			"Primary Information": [
				{
					"field": "LocalId",
					"title": "Local ID",
					"type": "String",
					"defaultValue": "48293"
				},
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Emily Wazowski"
				},
				{
					"field": "Dob",
					"title": "Date of Birth",
					"type": "Date",
					"defaultValue": "2/23/04"
				},
				{
					"field": "Grade",
					"title": "Grade",
					"type": "Number",
					"defaultValue": "10"
				},
				{
					"field": "DisplayGender",
					"title": "Gender",
					"type": "String",
					"defaultValue": "F"
				},
				{
					"field": "Cohort",
					"title": "Cohort",
					"type": "String"
				},
				{
					"field": "District",
					"title": "District",
					"type": "String",
					"defaultValue": "Springfield"
				},
				{
					"field": "AttendanceSchoolName",
					"title": "School of Attendance",
					"type": "String",
					"defaultValue": "Springfield Elementary School"
				},
				{
					"field": "Mifromschl",
					"title": "Distance (Attendance)",
					"type": "Number",
					"defaultValue": "1.3 mi"
				},
				{
					"field": "MifromResidSch",
					"title": "Distance (Residence)",
					"type": "Number",
					"defaultValue": "1.3 mi"
				},
				{
					"field": "ResidenceSchoolName",
					"title": "School of Residence",
					"type": "String",
					"defaultValue": "Springrield Elementary School"
				},
				{
					"field": "LoadTime",
					"title": "Load Time",
					"type": "Number",
					"defaultValue": "30"
				},
				{
					"field": "ImageBase64",
					"title": "Picture",
					"type": "RecordPicture",
					"defaultValue": false,
					"min-height": "2"
				}
			],
			"Eligibility": [
				{
					"field": "Transported",
					"title": "Eligible for Transport",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Eligible for Transport",
					"positiveLabel": "Eligible for Transport",
					"negativeLabel": "Not Eligible for Transport"
				},
				{
					"field": "AidEligible",
					"title": "Eligible for Aid",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Not Eligible for Aid",
					"positiveLabel": "Eligible for Aid",
					"negativeLabel": "Not Eligible for Aid"
				},
				{
					"field": "InActive",
					"title": "Inactive",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Active",
					"positiveLabel": "Inactive",
					"negativeLabel": "Active"
				},
				{
					"field": "AideReq",
					"title": "Bus Aide Required",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Bus Aide Required",
					"positiveLabel": "Bus Aide Required",
					"negativeLabel": "Bus Aid Not Required"
				},
				{
					"field": "Disabled",
					"title": "Disabled",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Not Disabled",
					"positiveLabel": "Disabled",
					"negativeLabel": "Not Disabled"
				}
			],
			"Codes": [
				{
					"field": "EthnicCodes",
					"title": "Ethnic Codes",
					"type": "String",
					"defaultValue": "Y"
				},
				{
					"field": "DisabilityCodes",
					"title": "Disability Codes",
					"type": "String",
					"defaultValue": "<none>"
				}
			],
			"Address": [
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State St."
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Basement"
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "MailState",
					"title": "Mailing Address State",
					"type": "String",
					"defaultValue": "NY"
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				},
				{
					"field": "GeoStreet",
					"title": "GeoCode Address Street",
					"type": "String",
					"defaultValue": "440 State St."
				},
				{
					"field": "GeoCity",
					"title": "GeoCode Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "GeoCounty",
					"title": "GeoCode Address Map Set",
					"type": "String"
				},
				{
					"field": "GeoZip",
					"title": "GeoCode Address Zip Code",
					"type": "String",
					"defaultValue": "12305"
				}
			],
			"Contact Info": [
				{
					"field": "Guardian",
					"title": "Guardian",
					"type": "String",
					"defaultValue": "Marge Wazowski"
				},
				{
					"field": "Phone",
					"title": "Home Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "Email",
					"title": "Email address",
					"type": "String",
					"defaultValue": "marge@wazowskis.com"
				},
				{
					"field": "EmerName1",
					"title": "Contact 1",
					"type": "String",
					"defaultValue": "Ned George"
				},
				{
					"field": "EmerPhone1",
					"title": "Contact 1 Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "EmerEmail1",
					"title": "Contact 1 Email",
					"type": "String",
					"defaultValue": "ned@emailerino.com"
				},
				{
					"field": "EmerName2",
					"title": "Contact 2",
					"type": "String",
					"defaultValue": "Moe Astley"
				},
				{
					"field": "EmerPhone2",
					"title": "Contact 2 Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609 x0000"
				},
				{
					"field": "EmerEmail2",
					"title": "Contact 2 Email",
					"type": "String",
					"defaultValue": "moe@moesrestaurant.com"
				},
				{
					"field": "Contactnotes",
					"title": "Contact Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"Miscellaneous": [
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "Schedule",
					"title": "Schedule",
					"type": "Schedule",
					"min-height": "4"
				},
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				}
			],
			"Notes": [
				{
					"field": "Comments",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserChar5",
					"title": "User Defined 5",
					"type": "String"
				},
				{
					"field": "UserChar6",
					"title": "User Defined 6",
					"type": "String"
				},
				{
					"field": "UserChar7",
					"title": "User Defined 7",
					"type": "String"
				},
				{
					"field": "UserChar8",
					"title": "User Defined 8",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			],
			"Grid": [
				{
					"field": "AMTripGrid",
					"title": "AM Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "amtripbystudentIds",
					"min-height": "3"
				},
				{
					"field": "PMTripGrid",
					"title": "PM Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "pmtripbystudentIds",
					"min-height": "3"
				},
				{
					"field": "AMTransferTripGrid",
					"title": "AM Transfer Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "amtransfertripsbystudentIds",
					"min-height": "3"
				},
				{
					"field": "PMTransferTripGrid",
					"title": "PM Transfer Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "pmtransfertripsbystudentIds",
					"min-height": "3"
				},
				{
					"field": "AllTripGrid",
					"title": "All Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "tripbystudentIds",
					"min-height": "3"
				},
				{
					"field": "AltsiteGrid",
					"title": "Alternate Site Grid",
					"type": "grid",
					"url": "altsite",
					"subUrl": "altsitebystudentIds",
					"min-height": "3"
				},
				{
					"field": "AMStopGrid",
					"title": "AM Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"subUrl": "amtripstopbystudentIds",
					"min-height": "3"
				},
				{
					"field": "PMStopGrid",
					"title": "PM Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"subUrl": "pmtripstopbystudentIds",
					"min-height": "3"
				},
				{
					"field": "AMTransferStopGrid",
					"title": "AM Transfer Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"subUrl": "amtransfertripstopbystudentIds",
					"min-height": "3"
				},
				{
					"field": "PMTransferStopGrid",
					"title": "PM Transfer Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"subUrl": "pmtransfertripstopbystudentIds",
					"min-height": "3"
				},
				{
					"field": "AllStopGrid",
					"title": "All Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"subUrl": "alltripstopbystudentIds",
					"min-height": "3"
				}
			]
		},
		"tripstop": {
			"Main": [
				{
					"field": "TripName",
					"title": "Trip Name",
					"type": "String",
					"defaultValue": "25 PM TES"
				},
				{
					"field": "Street",
					"title": "Street",
					"type": "String",
					"defaultValue": "31 Spooner Street"
				},
				{
					"field": "City",
					"title": "City",
					"type": "String",
					"defaultValue": "Schenectady"
				},
				{
					"field": "StopTime",
					"title": "Time",
					"type": "Time",
					"defaultValue": "16:02"
				},
				{
					"field": "NumStuds",
					"title": "Students",
					"type": "Number",
					"defaultValue": "3"
				},
				{
					"field": "Sequence",
					"title": "Sequence",
					"type": "String",
					"defaultValue": "12"
				},
				{
					"field": "TotalStopTime",
					"title": "Total Stop Time",
					"type": "Time",
					"defaultValue": "00:00:21",
					"format": "TimeSpan"
				},
				{
					"field": "Comment",
					"title": "Comments",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"Next Stop": [
				{
					"field": "NextStreet",
					"title": "Street",
					"type": "String",
					"defaultValue": "39 Spooner Street"
				},
				{
					"field": "NextTime",
					"title": "Time",
					"type": "Time",
					"defaultValue": "16:05"
				},
				{
					"field": "NextStudents",
					"title": "Students",
					"type": "Number",
					"defaultValue": "2"
				},
				{
					"field": "PreviousDistance",
					"title": "Distance",
					"type": "Number",
					"format": "0.00",
					"defaultValue": ".5"
				},
				{
					"field": "Duration",
					"title": "Duration",
					"type": "Time",
					"defaultValue": "00:00:15",
					"format": "TimeSpan"
				},
				{
					"field": "PreviousDrivingDirections",
					"title": "Driving Directions",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"Miscellaneous": [
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				},
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			],
			"Grid": [
				{
					"field": "SchoolGrid",
					"title": "School Grid",
					"type": "grid",
					"url": "school",
					"subUrl": "tripstop",
					"min-height": "3"
				},
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"subUrl": "tripstop",
					"min-height": "3"
				},
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "tripstop",
					"min-height": "3"
				}
			]
		},
		"trip": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "25 PM Bayside"
				},
				{
					"field": "Description",
					"title": "Description",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				},
				{
					"field": "TripAlias",
					"title": "Trip Alias",
					"type": "String",
					"defaultValue": "25 PM"
				},
				{
					"field": "VehicleName",
					"title": "Vehicle",
					"type": "String",
					"defaultValue": "42"
				},
				{
					"field": "DriverName",
					"title": "Driver",
					"type": "String",
					"defaultValue": "Ralph Norton"
				},
				{
					"field": "BusAideName",
					"title": "Bus Aide",
					"type": "String",
					"defaultValue": "Ed Kramden"
				},
				{
					"field": "Distance",
					"title": "Distance",
					"type": "Number",
					"format": "0.00",
					"defaultValue": "7.98"
				},
				{
					"field": "Cost",
					"title": "Cost",
					"type": "Number",
					"format": "Money",
					"defaultValue": "2.39"
				},
				{
					"field": "Dhdistance",
					"title": "Dead Head",
					"type": "Number",
					"format": "0.00",
					"defaultValue": "1.3"
				}
			],
			"Trip information": [
				{
					"field": "TotalStudents",
					"title": "Total Students Assigned",
					"type": "Number",
					"defaultValue": "52"
				},
				{
					"field": "EstTransport",
					"title": "Est Students Transported",
					"type": "Number"
				},
				{
					"field": "MaxOnBus",
					"title": "Max Students Assigned",
					"type": "Number"
				},
				{
					"field": "StartTime",
					"title": "Start Time",
					"type": "Time",
					"defaultValue": "07:14"
				},
				{
					"field": "FinishTime",
					"title": "Finish Time",
					"type": "Time",
					"defaultValue": "08:30"
				}
			],
			"Criteria": [
				{
					"field": "TripTypeName",
					"title": "Trip Type",
					"type": "String",
					"defaultValue": "To School"
				},
				{
					"field": "HomeSchl",
					"title": "Home To School",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Home To School",
					"positiveLabel": "Home To School",
					"negativeLabel": "No Home To School"
				},
				{
					"field": "HomeTrans",
					"title": "Home to Transfer",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "No Home to Transfer",
					"positiveLabel": "Home To Transfer",
					"negativeLabel": "No Home To Transfer"
				},
				{
					"field": "Shuttle",
					"title": "Transfer to School",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "No Transfer to School",
					"positiveLabel": "Transfer to School",
					"negativeLabel": "No Transfer to School"
				},
				{
					"field": "ActivityTrip",
					"title": "Activity Trip",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "No Activity Trip",
					"positiveLabel": "Activity Trip",
					"negativeLabel": "No Activity Trip"
				},
				{
					"field": "HasBusAide",
					"title": "Bus Aide on This Trip",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "No Bus Aide on This Trip",
					"positiveLabel": "Bus Aide on This Trip",
					"negativeLabel": "No Bus Aide on This Trip"
				},
				{
					"field": "NonDisabled",
					"title": "Non-Disabled Students",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Not Non-Disabled Students",
					"positiveLabel": "Non-Disabled Students",
					"negativeLabel": "Not Non-Disabled Students"
				},
				{
					"field": "Disabled",
					"title": "Disabled Students",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Not Disabled Students",
					"positiveLabel": "Disabled Students",
					"negativeLabel": "Not Disabled Students"
				},
				{
					"field": "Schools",
					"title": "School",
					"type": "String",
					"defaultValue": "Transfinder Elementary School"
				},
				{
					"field": "StopTime",
					"title": "School Stop Time",
					"type": "Time",
					"defaultValue": "00:10:00",
					"format": "TimeSpan"
				},
				{
					"field": "FilterName",
					"title": "Additional Students Filter Name",
					"type": "String"
				},
				{
					"field": "FilterSpec",
					"title": "Additional Student Filter Specification",
					"type": "String"
				}
			],
			"Interface Settings": [
				{
					"field": "IShow",
					"title": "Visible",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Visible",
					"positiveLabel": "Visible",
					"negativeLabel": "Not Visible"
				},
				{
					"field": "IName",
					"title": "Display Name",
					"type": "String",
					"defaultValue": "25"
				},
				{
					"field": "Description",
					"title": "Description",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				},
				{
					"field": "GpsenabledFlag",
					"title": "Busfinder Enabled",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Busfinder Enabled",
					"positiveLabel": "Busfinder Enabled",
					"negativeLabel": "Busfinder Not Enabled"
				}
			],
			"Miscellaneous": [
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				},
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "Student",
					"title": "Student"
				},
				{
					"field": "Calendar",
					"title": "Calendar",
					"type": "Calendar",
					"min-height": "4"
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			],
			"Grid": [
				{
					"field": "AideGrid",
					"title": "Aides Grid",
					"type": "grid",
					"url": "aide",
					"subUrl": "trip",
					"min-height": "3"
				},
				{
					"field": "DriverGrid",
					"title": "Driver Grid",
					"type": "grid",
					"url": "driver",
					"subUrl": "trip",
					"min-height": "3"
				},
				{
					"field": "VehicleGrid",
					"title": "Vehicle Grid",
					"type": "grid",
					"url": "vehicle",
					"subUrl": "trip",
					"min-height": "3"
				},
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"subUrl": "trip",
					"min-height": "3"
				},
				{
					"field": "StopGrid",
					"title": "Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"subUrl": "trip",
					"min-height": "3"
				}
			]
		},
		"vehicle": {
			"Main": [
				{
					"field": "VehicleName",
					"title": "Vehicle",
					"type": "String",
					"defaultValue": "592-A"
				},
				{
					"field": "Category",
					"title": "Category",
					"type": "String",
					"defaultValue": "Passenger"
				},
				{
					"field": "VehicleName",
					"title": "Name",
					"type": "String",
					"defaultValue": "592-A"
				},
				{
					"field": "Inactive",
					"title": "Inactive",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Active",
					"positiveLabel": "Inactive",
					"negativeLabel": "Active"
				},
				{
					"field": "AssetId",
					"title": "Asset ID",
					"type": "String",
					"defaultValue": "49273"
				},
				{
					"field": "Gpsid",
					"title": "GPS ID",
					"type": "String",
					"defaultValue": "FJRUW9234"
				},
				{
					"field": "Capacity",
					"title": "Capacity",
					"type": "Number",
					"defaultValue": "10"
				},
				{
					"field": "Mpg",
					"title": "MPG",
					"type": "Number",
					"defaultValue": "10"
				},
				{
					"field": "Cost",
					"title": "Rate/mi",
					"type": "Number",
					"format": "Money",
					"defaultValue": ".30"
				},
				{
					"field": "WcCapacity",
					"title": "W/C Capacity",
					"type": "Number",
					"defaultValue": "1"
				},
				{
					"field": "Length",
					"title": "Length",
					"type": "Number",
					"defaultValue": "20 ft"
				},
				{
					"field": "Height",
					"title": "Height",
					"type": "Number",
					"defaultValue": "8 ft"
				},
				{
					"field": "LicensePlate",
					"title": "License Plate",
					"type": "String",
					"defaultValue": "ECTO-1"
				},
				{
					"field": "MaxWeight",
					"title": "Max Weight",
					"type": "Number",
					"defaultValue": "3000"
				},
				{
					"field": "Width",
					"title": "Width",
					"type": "Number",
					"defaultValue": "6.68"
				},
				{
					"field": "Vin",
					"title": "VIN",
					"type": "String",
					"defaultValue": "FR8F62NDL923XAF54"
				},
				{
					"field": "EstLife",
					"title": "Est. Life",
					"type": "Number",
					"defaultValue": "4"
				},
				{
					"field": "ContractorName",
					"title": "Contractor",
					"type": "String",
					"defaultValue": "Joe's Charter Buses"
				},
				{
					"field": "FuelCapacity",
					"title": "Fuel Capacity(gal)",
					"type": "Number",
					"defaultValue": "22"
				},
				{
					"field": "PurchaseDate",
					"title": "Purchase Date",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "SalvageDate",
					"title": "Salvage Date",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "PurchasePrice",
					"title": "Purchase Price ",
					"type": "Number",
					"format": "Money",
					"defaultValue": "4800"
				},
				{
					"field": "SalvageValue",
					"title": "Salvage Value",
					"type": "Number",
					"format": "Money",
					"defaultValue": "2000"
				},
				{
					"field": "PurchaseMileage",
					"title": "Purchase Odometer",
					"type": "Number",
					"defaultValue": "100000"
				},
				{
					"field": "SalvageMileage",
					"title": "Salvage Odometer",
					"type": "Number",
					"defaultValue": "200000"
				},
				{
					"field": "RegisNum",
					"title": "Registration Num",
					"type": "String",
					"defaultValue": "4293747242"
				},
				{
					"field": "RegisExp",
					"title": "Registration Expires",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "InsuranceNum",
					"title": "Insurance Num",
					"type": "String",
					"defaultValue": "1902839423947"
				},
				{
					"field": "InsuranceExp",
					"title": "Insurance Expires",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "StateInspection",
					"title": "State Inspection",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "InspectionExp",
					"title": "State Inspection Expires",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "EmmissInsp",
					"title": "Emissions Inspection",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "ImageBase64",
					"title": "Picture",
					"type": "RecordPicture",
					"defaultValue": "42839",
					"min-height": "2"
				}
			],
			"Equipment": [
				{
					"field": "YearMade",
					"title": "Year Manufactured",
					"type": "Number",
					"defaultValue": "2018"
				},
				{
					"field": "Model",
					"title": "Model",
					"type": "String",
					"defaultValue": "Thomas"
				},
				{
					"field": "MakeChassis",
					"title": "Make of Chassis",
					"type": "String",
					"defaultValue": "Thomas"
				},
				{
					"field": "MakeBody",
					"title": "Make of Body",
					"type": "String",
					"defaultValue": "Thomas"
				},
				{
					"field": "BodyType",
					"title": "Body Type",
					"type": "String",
					"defaultValue": "Bus"
				},
				{
					"field": "BrakeType",
					"title": "Brake Type",
					"type": "String",
					"defaultValue": "Drum"
				},
				{
					"field": "FuelType",
					"title": "Fuel Type",
					"type": "String",
					"defaultValue": "Diesel"
				},
				{
					"field": "EquipmentCodes",
					"title": "Equipment",
					"type": "String",
					"defaultValue": "Musical Instruments"
				}
			],
			"Miscellaneous": [
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "File",
					"title": "Documents",
					"type": "File",
					"defaultValue": "File list/browser",
					"min-height": "3"
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				},
				{
					"field": "Schedule",
					"title": "Schedule",
					"type": "Schedule",
					"min-height": "3"
				}
			],
			"User Defined": [
				{
					"field": "UserChar1",
					"title": "User Defined 1",
					"type": "String"
				},
				{
					"field": "UserChar2",
					"title": "User Defined 2",
					"type": "String"
				},
				{
					"field": "UserChar3",
					"title": "User Defined 3",
					"type": "String"
				},
				{
					"field": "UserChar4",
					"title": "User Defined 4",
					"type": "String"
				},
				{
					"field": "UserDate1",
					"title": "User Date 1",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate2",
					"title": "User Date 2",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate3",
					"title": "User Date 3",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserDate4",
					"title": "User Date 4",
					"type": "Date",
					"defaultValue": today
				},
				{
					"field": "UserNum1",
					"title": "User Numeric 1",
					"type": "Number"
				},
				{
					"field": "UserNum2",
					"title": "User Numeric 2",
					"type": "Number"
				},
				{
					"field": "UserNum3",
					"title": "User Numeric 3",
					"type": "Number"
				},
				{
					"field": "UserNum4",
					"title": "User Numeric 4",
					"type": "Number"
				}
			],
			"Grid": [
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"subUrl": "tripbyvehicleIds",
					"min-height": "3"
				}
			]
		}
	};