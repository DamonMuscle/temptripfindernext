<%@ Page Language="C#" %>
<script runat="server">
    protected void Page_Load(object sender, EventArgs e)
	{
		string dbId = Request.QueryString["DB"];
		string tripId = Request.QueryString["editft"];
		string urlPath = this.ResolveUrl(string.Format("~/?DB={0}", dbId));

		if (tripId != null)
		{
			urlPath += string.Format("&tripid={0}", tripId);
		}

		Response.RedirectPermanent(urlPath);
	}
</script>