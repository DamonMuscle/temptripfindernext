<!DOCTYPE html>
<html lang="en">

<head>
	<title>Tripfinder</title>
	<meta http-equiv="content-type" content="text/html;charset=UTF-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
	<link href="Global/img/Transfinder-TripfinderText-Only.png" rel="shortcut icon" type="image/png">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, minimum-scale=1, user-scalable=0"
	/>
	<meta name="format-detection" content="telephone=no" />
	<!-- this page is used for redirect the link in notification email to Tripfinder as the InfofinderLE use jumpto.aspx to redirect to InfofinderLE. FT-380 -->
	<script>
		(function()
		{
			function redirect()
			{
				var parm = location.href;
				var start = parm.indexOf("?") != -1 ? parm.indexOf("?") + 1 : parm.length;
				var end = parm.indexOf("#") != -1 ? parm.indexOf("#") : parm.length;
				parm = parm.substring(start, end);
				window.location.href = 'index.html?' + parm;
			}
			redirect();
		})();

	</script>
</head>

<body>
</body>

</html>