diff --git a//dev/null b/server/plumber.R
index 0000000000000000000000000000000000000000..284a00548bd32057d4d53f32c4c282f4ac94a15c 100644
--- a//dev/null
+++ b/server/plumber.R
@@ -0,0 +1,38 @@
+library(plumber)
+library(jsonlite)
+library(readr)
+
+# Load data once when the API starts
+DATA_PATH <- "server/data/global_complete_data.json"
+COUNTRY_CSV <- "server/data/TOTAL-Greenhouse-Gases/API_EN.GHG.ALL.MT.CE.AR5_DS2_en_csv_v2_6842.csv"
+
+global_data <- read_json(DATA_PATH, simplifyVector = TRUE)
+
+country_data <- read_csv(COUNTRY_CSV, show_col_types = FALSE)
+countries <- unique(country_data[c("Country.Name", "Country.Code")])
+
+#* List available countries
+#* @serializer json
+#* @get /countries
+function(){
+  countries
+}
+
+#* Get statistics for a country within a year range
+#* @param country Country code (e.g., 'ABW')
+#* @param start Start year (e.g., 2000)
+#* @param end End year (e.g., 2020)
+#* @serializer json
+#* @get /stats
+function(country="ABW", start=1960, end=2024){
+  if(!country %in% names(global_data)){
+    res <- list(error = "Unknown country code")
+    return(res)
+  }
+  data <- global_data[[country]]
+  years <- as.character(start:end)
+  available_years <- intersect(names(data), years)
+  result <- lapply(available_years, function(y){ data[[y]] })
+  names(result) <- available_years
+  result
+}
