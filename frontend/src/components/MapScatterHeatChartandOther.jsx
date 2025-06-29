import React, { useEffect, useState } from "react";
import { scaleSequential } from "d3-scale";
import { interpolateReds } from "d3-scale-chromatic";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule
} from "react-simple-maps";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { ScatterChart } from '@mui/x-charts/ScatterChart';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const MapChart = () => {
  const [data, setData] = useState([]);
  const [codeMap, setCodeMap] = useState({});
  const [selectedYear, setSelectedYear] = useState(2023);
  const [selectedGas, setSelectedGas] = useState("total");

  const yearMarks = [
    { value: 1970, label: '1970' },
    { value: 1980, label: '1980' },
    { value: 1990, label: '1990' },
    { value: 2000, label: '2000' },
    { value: 2010, label: '2010' },
    { value: 2020, label: '2020' },
  ];

  // 1. Fetch country-code JSON sekali
  useEffect(() => {
    fetch("http://localhost:8000/country-code-and-numeric.json")
      .then((res) => res.json())
      .then((list) => {
        const map = list.reduce((acc, { code, alpha3 }) => {
          // pastikan key-nya string, dan nilai uppercase (sesuai geo.id)
          acc[String(code)] = alpha3.toUpperCase();
          return acc;
        }, {});
        setCodeMap(map);
      })
      .catch((err) => console.error("Error loading country codes:", err));
  }, []);

  // 2. Fetch data emisi dan apply mapping numeric → alpha3
  useEffect(() => {
    // tunggu kode sudah ter-load
    if (!Object.keys(codeMap).length) return;

    async function fetchData() {
      try {
        const res = await fetch(
          `http://localhost:8000/map-data?year=${selectedYear}&gas_type=${selectedGas}`
        );
        const result = await res.json();
        const updated = result.map((d) => ({
          ...d,
          // jika ada mapping, pakai, kalau tidak biarkan id-nya apa adanya
          id: codeMap[String(d.id)] || d.id
        }));
        setData(updated);
      } catch (err) {
        console.error("Error fetching map data:", err);
      }
    }

    fetchData();
  }, [selectedYear, selectedGas, codeMap]);

  const maxVal = data.length ? Math.max(...data.map((d) => d.value)) : 100;
  const minVal = data.length ? Math.min(...data.map((d) => d.value)) : 0;
  const colorScale = scaleSequential(interpolateReds).domain([minVal, maxVal]);

  // Create legend ranges
  const createLegendRanges = () => {
    const ranges = [];
    const step = (maxVal - minVal) / 5;
    for (let i = 0; i < 5; i++) {
      const start = minVal + (step * i);
      const end = minVal + (step * (i + 1));
      ranges.push({
        min: start.toFixed(1),
        max: end.toFixed(1),
        color: colorScale(start + step / 2)
      });
    }
    return ranges;
  };

  const legendRanges = createLegendRanges();


  return (  
    <Grid container spacing={2} columns={5} rows={3} direction="row">
      <Grid item size={{xs:5, md:1}}>
        <Typography gutterBottom>Gas Type</Typography>
        <Select
          value={selectedGas}
          onChange={(e) => setSelectedGas(e.target.value)}
          fullWidth
        >
          {['total', 'co2', 'ch4', 'n2o'].map((gas) => (
            <MenuItem key={gas} value={gas}>{gas.toUpperCase()}</MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid item size={{xs:5, md:3}}>
      </Grid>
      <Grid item size={{xs:5, md:1}}>
        <Typography gutterBottom>Year</Typography>
        <Slider
          value={selectedYear}
          onChange={(e, newValue) => setSelectedYear(newValue)}
          valueLabelDisplay="auto"
          step={1}
          marks={yearMarks}
          min={1970}
          max={2025}
          size="small"
        />
      </Grid>
      <Grid item size={5}>
        <Card variant="outlined">
          <CardContent>
            <div style={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  backgroundColor: 'none',
                  padding: 2,
                  width: 200,
                  zIndex: 10
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Emission Levels
                </Typography>
                {legendRanges.map((range, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: {sx: 1, md:0.5}, width: '100%' }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 15,
                        backgroundColor: range.color,
                        marginRight: 1,
                        border: '1px solid #ccc'
                      }}
                    />
                    <Typography variant="caption">
                      {range.min} - {range.max}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <ComposableMap
                viewBox="0 125 800 350"
                projectionConfig={{ rotate: [-10, 0, 0], scale: 120 }}
                className="rsm-svg"
                style={{ width: '100%', height: 'auto' }}
              >
                <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
                <Graticule stroke="#F53" strokeWidth={0.5} />
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const numericId = geo.id;
                      const iso3 = codeMap[String(numericId)] || null;
                      const countryData = data.find(d => d["id"][0] === iso3);
                      return (
                        <Tooltip
                          key={geo.rsmKey}
                          title={countryData ? `${countryData.id}: ${countryData.value}` : "No data available"}
                          placement="top"
                          arrow
                        >
                          <g>
                            <Geography
                              geography={geo}
                              fill={countryData ? colorScale(countryData.value) : "#F3F4F6"}
                              stroke="white"
                              strokeWidth={0.5}
                              style={{
                                hover: {
                                  fill: countryData ? colorScale(Math.min(countryData.value * 1.1, maxVal)) : "#E5E7EB",
                                  outline: "none",
                                  cursor: "pointer"
                                },
                                pressed: {
                                  fill: countryData ? colorScale(Math.min(countryData.value * 1.2, maxVal)) : "#D1D5DB",
                                  outline: "none"
                                }
                              }}
                            />
                          </g>
                        </Tooltip>
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>
          </CardContent>
        </Card>
        <Box>
          <ScatterChart
          height={300}
          series={[
            {
              label: 'Negara/ Area',
              data: data.map((v, i) => ({ x: i, y: v.value[0], id: v["id"][0]})),
              valueFormatter: (dataPoint) => {
                return `${dataPoint.id}: ${dataPoint.y}`;
              },
            },
          ]}
          grid={{ vertical: true, horizontal: true }}
        />
        </Box>
      </Grid>
    </Grid>
  );
};
export default MapChart;  