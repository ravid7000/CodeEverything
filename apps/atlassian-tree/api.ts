import { useEffect, useState } from "react";

export type BackendDataItemType = {
  id: string;
  name: string;
  subItems: BackendDataItemType[];
};

const backendData = [
  {
    id: "1",
    name: "Office Map",
  },
  {
    id: "2",
    name: "New Employee Onboarding",
    subItems: [
      {
        id: "8",
        name: "Onboarding Materials",
      },
      {
        id: "9",
        name: "Training",
      },
    ],
  },
  {
    id: "3",
    name: "Office Events",
    subItems: [
      {
        id: "6",
        name: "2018",
        subItems: [
          {
            id: "10",
            name: "Summer Picnic",
          },
          {
            id: "11",
            name: "Valentine's Day Party",
          },
          {
            id: "12",
            name: "New Year's Party",
          },
        ],
      },
      {
        id: "7",
        name: "2017",
        subItems: [
          {
            id: "13",
            name: "Company Anniversary Celebration",
          },
        ],
      },
    ],
  },
  {
    id: "4",
    name: "Public Holidays",
  },
  {
    id: "5",
    name: "Vacations and Sick Leaves",
  },
];

export const fetchData = () => {
  return new Promise<BackendDataItemType[]>((resolve) => {
    setTimeout(() => {
      resolve(backendData as BackendDataItemType[]);
    }, 1000);
  });
};

export const useFetchData = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BackendDataItemType[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    fetchData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const expandItem = (id: string) => {
    setExpanded((prevState) => {
      const prevId = prevState.find((prev) => prev === id);
      if (prevId) {
        return prevState.filter((prev) => prev !== id);
      }
      return [...prevState, id];
    });
  };

  return {
    loading,
    data,
    expanded,
    expandItem,
  };
};
