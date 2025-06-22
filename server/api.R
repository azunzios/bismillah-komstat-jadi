# server/api.R

library(plumber)
library(jsonlite)
library(dplyr)
library(readr)

# Fungsi untuk menghitung modus
calculate_mode <- function(x) {
  x_cleaned <- x[!is.na(x)]
  if (length(x_cleaned) == 0) return(NA)
  ux <- unique(x_cleaned)
  ux[which.max(tabulate(match(x_cleaned, ux)))]
}

# Muat data saat startup
global_data <- fromJSON("data/global_complete_data.json")
country_meta <- read_csv("data/TOTAL-Greenhouse-Gases/data_total_greenhouse.csv")

#* @apiTitle Greenhouse Gas Emissions API

#* Mengembalikan daftar negara
#* @get /countries
function() {
  country_list <- country_meta %>%
    select(`Country.Name`, `Country.Code`) %>%
    filter(!is.na(`Country.Name`)) %>%
    rename(name = `Country.Name`, code = `Country.Code`)

  return(list(countries = country_list))
}

#* Menghitung statistik untuk negara dan rentang tahun
#* @param country_code Kode negara (e.g., "IDN")
#* @param start_year Tahun mulai (e.g., 1990)
#* @param end_year Tahun akhir (e.g., 2020)
#* @get /statistics
function(country_code, start_year, end_year) {
  if (is.null(global_data[[country_code]])) {
    stop("Country code not found")
  }

  start_year <- as.integer(start_year)
  end_year <- as.integer(end_year)
  country_data <- global_data[[country_code]]

  calculate_stats_for_gas <- function(country_data, gas_type) {
    years <- as.character(start_year:end_year)
    values <- sapply(years, function(yr) {
      year_data <- country_data[[yr]]
      if (is.null(year_data)) return(NA)
      val <- year_data[[gas_type]]
      if (is.null(val)) return(NA)
      return(as.numeric(val))
    })
    # Buat raw_values: named list tahun -> nilai
    raw_values <- as.list(values)
    names(raw_values) <- years
    values_clean <- values[!is.na(values)]
    if (length(values_clean) < 2) {
      return(list(
        mean = NA, median = NA, mode = NA, range = NA,
        q1 = NA, q3 = NA, std_dev = NA, variance = NA,
        raw_values = raw_values
      ))
    }
    quartiles <- quantile(values_clean, probs = c(0.25, 0.75), na.rm = TRUE)
    list(
      mean = mean(values_clean),
      median = median(values_clean),
      mode = calculate_mode(values_clean),
      range = max(values_clean) - min(values_clean),
      q1 = quartiles[[1]],
      q3 = quartiles[[2]],
      std_dev = sd(values_clean),
      variance = var(values_clean),
      raw_values = raw_values
    )
  }

  stats <- list(
    total = calculate_stats_for_gas(country_data, "total"),
    co2 = calculate_stats_for_gas(country_data, "co2"),
    n2o = calculate_stats_for_gas(country_data, "n2o"),
    ch4 = calculate_stats_for_gas(country_data, "ch4")
  )

  return(stats)
}

#* Menghitung persentase pertumbuhan
#* @param country_code Kode negara (e.g., "IDN")
#* @param start_year Tahun mulai (e.g., 1990)
#* @param end_year Tahun akhir (e.g., 2020)
#* @get /growth
function(country_code, start_year, end_year) {
  if (is.null(global_data[[country_code]])) {
    stop("Country code not found")
  }

  start_year <- as.integer(start_year)
  end_year <- as.integer(end_year)
  country_data <- global_data[[country_code]]

  calculate_growth_for_gas <- function(country_data, gas_type) {
    start_val <- country_data[[as.character(start_year)]][[gas_type]]
    end_val <- country_data[[as.character(end_year)]][[gas_type]]

    if (is.null(start_val)) start_val <- NA
    if (is.null(end_val)) end_val <- NA

    start_val <- as.numeric(start_val)
    end_val <- as.numeric(end_val)

    if (is.na(start_val) || is.na(end_val) || start_val == 0) {
      return(NA_real_)
    }

    return(as.numeric(((end_val - start_val) / start_val) * 100))
  }

  growth_rates <- list(
    total = calculate_growth_for_gas(country_data, "total"),
    co2 = calculate_growth_for_gas(country_data, "co2"),
    n2o = calculate_growth_for_gas(country_data, "n2o"),
    ch4 = calculate_growth_for_gas(country_data, "ch4")
  )
  # Pastikan hasilnya number, bukan array/list
  for (k in names(growth_rates)) {
    if (is.list(growth_rates[[k]]) || is.vector(growth_rates[[k]])) {
      growth_rates[[k]] <- as.numeric(growth_rates[[k]][1])
    }
  }
  return(growth_rates)
}
