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

#* Mengembalikan daftar negara
#* @get /global-complete-data.json
function() {
  return(global_data)
}

#* Menghitung statistik untuk negara dan rentang tahun
#* @param country_code Kode negara (e.g., "IDN")
#* @param start_year Tahun mulai (opsional jika 'year' digunakan)
#* @param end_year Tahun akhir (opsional jika 'year' digunakan)
#* @param year Tahun tunggal (opsional)
#* @get /statistics
function(country_code, start_year = NULL, end_year = NULL, year = NULL) {
  if (is.null(global_data[[country_code]])) {
    stop("Country code not found")
  }

  # If single year provided, use it for both start and end
  if (!is.null(year) && (is.null(start_year) || is.null(end_year))) {
    start_year <- as.integer(year)
    end_year <- as.integer(year)
  }
  start_year <- as.integer(start_year)
  end_year <- as.integer(end_year)
  if (is.na(start_year) || is.na(end_year)) {
    stop("Invalid or missing year parameters")
  }
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
      max = max(values_clean),
      min = min(values_clean),
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

#* Get map data for a specific year and gas type
#* @param year The year to get data for
#* @param gas_type The gas type (total, co2, ch4, n2o)
#* @get /map-data
function(year, gas_type = "total") {
  # Validate gas type
  valid_gases <- c("total", "co2", "ch4", "n2o")
  if (!gas_type %in% valid_gases) {
    gas_type <- "total"  # Default to total if invalid
  }
  
  # Convert year to numeric
  year <- as.character(year)
  
  # Initialize result list
  result <- list()
  
  # Loop through each country in the data
  for (country_code in names(global_data)) {
    country_data <- global_data[[country_code]]
    
    # Get the data for the specified year and gas type
    year_data <- country_data[[year]]
    if (!is.null(year_data)) {
      gas_value <- year_data[[gas_type]]
      
      # If gas_value is a list, take the first element
      if (is.list(gas_value) && length(gas_value) > 0) {
        gas_value <- gas_value[[1]]
      }
      
      # Convert to numeric and handle NAs/Nulls
      if (!is.null(gas_value) && !is.na(gas_value) && length(gas_value) > 0) {
        gas_value_num <- suppressWarnings(as.numeric(gas_value))
        if (!is.na(gas_value_num)) {
          result[[length(result) + 1]] <- list(
            id = country_code,
            value = gas_value_num
          )
        }
      }
    }
  }
  
  return(result)
}

#* Get country-code-and-numeric.json
#* @get /country-code-and-numeric.json
function() {
  return(fromJSON("data/country-code-and-numeric.json"))
}

#* Calculate growth percentage
#* @param country_code Country code (e.g., "WLD")
#* @param start_year Start year (e.g., 2000)
#* @param end_year End year (e.g., 2023)
#* @get /growth
function(country_code, start_year, end_year, res) {
  tryCatch({
    # Input validation
    if (missing(country_code) || missing(start_year) || missing(end_year)) {
      stop("Missing required parameters: country_code, start_year, and end_year are required")
    }
    
    # Convert and validate parameters
    start_year_int <- as.integer(start_year)
    end_year_int <- as.integer(end_year)
    
    if (is.na(start_year_int) || is.na(end_year_int)) {
      stop("Invalid year format. Please provide numeric values for years")
    }
    
    # Validate year range
    if (start_year_int >= end_year_int) {
      stop("End year must be greater than start year")
    }
    
    # Check if country exists in data
    if (is.null(global_data[[country_code]])) {
      stop(sprintf("Country code '%s' not found in the dataset.", country_code))
    }
    
    country_data <- global_data[[country_code]]
    
    # Helper function to safely get growth for a gas type
    calculate_growth <- function(gas_type) {
      tryCatch({
        start_year_str <- as.character(start_year_int)
        end_year_str <- as.character(end_year_int)
        
        if (!start_year_str %in% names(country_data)) {
          return(list(value = 0, error = sprintf("Start year %s not found in data", start_year_str)))
        }
        
        if (!end_year_str %in% names(country_data)) {
          return(list(value = 0, error = sprintf("End year %s not found in data", end_year_str)))
        }
        
        start_data <- country_data[[start_year_str]]
        end_data <- country_data[[end_year_str]]
        
        if (is.null(start_data) || is.null(end_data)) {
          return(list(value = 0, error = "Missing data for one of the years."))
        }
        
        start_value <- start_data[[gas_type]]
        end_value <- end_data[[gas_type]]
        
        if (is.null(start_value) || is.null(end_value)) {
           return(list(value = 0, error = sprintf("Missing data for %s in one or both years", gas_type)))
        }

        # Convert to numeric if it's a list or vector
        if (is.list(start_value) || length(start_value) > 1) start_value <- start_value[[1]]
        if (is.list(end_value) || length(end_value) > 1) end_value <- end_value[[1]]

        start_value_num <- suppressWarnings(as.numeric(start_value))
        end_value_num <- suppressWarnings(as.numeric(end_value))
        
        if (is.na(start_value_num) || is.na(end_value_num)) {
          return(list(value = 0, error = "Non-numeric data found."))
        }
        
        if (start_value_num == 0) {
          return(list(value = 0, error = "Start value is zero, cannot calculate percentage change."))
        }
        
        growth <- ((end_value_num - start_value_num) / abs(start_value_num)) * 100
        
        if (!is.finite(growth)) {
          return(list(value = 0, error = "Invalid growth calculation resulted in non-finite number."))
        }
        
        list(value = round(growth, 2), error = NULL)
        
      }, error = function(e) {
        list(value = 0, error = conditionMessage(e))
      })
    }
    
    gas_types <- c("total", "co2", "ch4", "n2o")
    growth_results <- lapply(gas_types, calculate_growth)
    
    response <- list(
      status = "success",
      country = country_code,
      start_year = start_year_int,
      end_year = end_year_int,
      growth = setNames(
        lapply(growth_results, function(x) {
          list(
            value = x$value,
            unit = "%",
            error = x$error
          )
        }),
        gas_types
      ),
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    return(response)
    
  }, error = function(e) {
    error_msg <- conditionMessage(e)
    res$status <- 400
    list(
      status = "error",
      error = error_msg,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
  })
}