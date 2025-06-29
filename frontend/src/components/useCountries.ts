import { useEffect, useState } from 'react';

export interface CountryItem {
  name: string;
  code: string;
}

export function useCountries() {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('http://127.0.0.1:8000/countries')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.countries)) {
          // World at very top, then continents, then the rest
          const worldCodes = ['WLD'];
          const continentCodes = ['AFR', 'EAS', 'ECS', 'LCN', 'MEA', 'NAC', 'SAS', 'SSF', 'EMU', 'EUU', 'CEB', 'CSS', 'EAP', 'ECA', 'HIC', 'HPC', 'LAC', 'LIC', 'LMC', 'LMY', 'MIC', 'NOC', 'OED', 'OSS', 'PRE', 'PSS', 'PST', 'SST', 'UMC'];
          let world: CountryItem | undefined;
          const continents: CountryItem[] = [];
          const rest: CountryItem[] = [];
          data.countries.forEach((c: CountryItem) => {
            if (c.code === 'WLD' || ['World', 'WORLD', 'world'].includes(c.name)) {
              world = c;
            } else if (continentCodes.includes(c.code)) {
              continents.push(c);
            } else {
              rest.push(c);
            }
          });
          const sortedContinents = continents.sort((a, b) => a.name.localeCompare(b.name));
          const sortedRest = rest.sort((a, b) => a.name.localeCompare(b.name));
          setCountries([
            ...(world ? [world] : []),
            ...sortedContinents,
            ...sortedRest,
          ]);
        } else {
          setError('Format data negara dari API tidak sesuai.');
          setCountries([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  return { countries, loading, error };
}
