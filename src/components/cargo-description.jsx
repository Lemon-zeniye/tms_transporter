import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Grid,
  Group,
  NumberInput,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  addShipmentItem,
  selectDropOffLocations,
  selectShipmentItems,
} from "../store/shipment";
import { notifications } from "@mantine/notifications";

function CargoDescription({ nextStep, prevStep }) {
  const dispatch = useDispatch();
  const shipmentItems = useSelector(selectShipmentItems);
  const dropOffLocations = useSelector(selectDropOffLocations);

  const schema = z.object({
    id: z.string().default(uuidv4()),
    itemCategory: z.string("Item category is required"),
    packagingType: z.string("Packaging type is required"),
    itemDescription: z.string("Item description is required"),
    quantity: z.number().min(1, "Quantity must be greater than 0"),
    dimension: z.object({
      length: z.number().min(1, "Length must be greater than 0"),
      width: z.number().min(1, "Width must be greater than 0"),
      height: z.number().min(1, "Height must be greater than 0"),
    }),
    weight: z.number().min(1, "Weight must be greater than 0"),
    totalWeight: z.number().min(1, "Total weight must be greater than 0"),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const quantity = watch("quantity");
  const weight = watch("weight");

  const totalWeight = quantity * weight;

  React.useEffect(() => {
    setValue("totalWeight", totalWeight);
  }, [quantity, weight, setValue, totalWeight]);

  const [locationSelected, setLocationSelected] = useState([]);

  const [selectedDropOffLocation, setSelectedDropOffLocation] = useState(null);
  const maxItemQuantity = watch("quantity") ?? 0;
  const maxTotalQuantity = watch("quantity") ?? 0;

  const handleSelectChange = (selectedId) => {
    const selectedLocation = dropOffLocations.find(
      (loc) => loc.id === selectedId
    );

    if (locationSelected.find((loc) => loc.id === selectedId)) return;

    if (selectedLocation) {
      setLocationSelected((prevState) => [
        ...prevState,
        { id: selectedLocation.id, quantity: 0 },
      ]);
      setSelectedDropOffLocation(selectedLocation.id);
    }
  };

  const handleQuantityChange = (value) => {
    if (selectedDropOffLocation) {
      const currentTotalQuantity = locationSelected.reduce(
        (sum, loc) => sum + loc.quantity,
        0
      );

      const newTotalQuantity =
        currentTotalQuantity -
        (locationSelected.find((loc) => loc.id === selectedDropOffLocation)
          ?.quantity || 0) +
        value;

      if (newTotalQuantity <= maxTotalQuantity) {
        setLocationSelected((prevState) =>
          prevState.map((loc) =>
            loc.id === selectedDropOffLocation
              ? { ...loc, quantity: Math.min(value, maxItemQuantity) }
              : loc
          )
        );
      } else {
        notifications.show({
          title: "Error",
          message: `Total quantity cannot exceed ${maxTotalQuantity}`,
          color: "red",
        });
      }
    }
  };

  const onSubmit = (data) => {
    if (dropOffLocations?.length > 1 && locationSelected?.length === 0) {
      notifications.show({
        title: "Error",
        message: "Please Select a drop of Location",
        color: "red",
      });
      return;
    }
    if (dropOffLocations?.length > 1 && locationSelected?.length > 0) {
      const totalQuantity = locationSelected.reduce(
        (total, loc) => total + loc.quantity,
        0
      );

      console.log("333333333", totalQuantity);
      if (totalQuantity !== maxItemQuantity) {
        notifications.show({
          title: "Error",
          message: `Please put a quantity of ${maxItemQuantity} items`,
          color: "red",
        });
        return;
      }
    }
    setLocationSelected([]);
    setSelectedDropOffLocation(null);
    const newData = { ...data, dropOffLocations: locationSelected };
    dispatch(addShipmentItem(newData));
    resetFrom();
  };

  const nextStepCalled = () => {
    if (shipmentItems?.length > 0) {
      nextStep();
      return;
    }
    handleSubmit(onSubmit)();

    if (isValid) {
      nextStep();
    }
  };

  const addToList = () => {
    handleSubmit(onSubmit)();
  };

  const resetFrom = () => {
    reset();
    setValue("itemCategory", null);
    setValue("packagingType", null);
    setValue("itemDescription", "");
    setValue("quantity", 0);
    setValue("dimension.length", 0);
    setValue("dimension.height", 0);
    setValue("dimension.width", 0);
    setValue("weight", 0);
    setValue("totalWeigth", 0);
  };

  return (
    <div>
      <div className="w-full min-h-[50vh] rounded-lg shadow-lg p-5 border-t border-t-gray-100 bg-white">
        <form>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
            <Controller
              name="itemCategory"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  name={name}
                  value={value}
                  onChange={onChange}
                  label="Item Category"
                  placeholder="Item Category"
                  searchable
                  data={[
                    "Parcels and Small Packages",
                    "Bulk Items",
                    "Household Goods and Personal Effects",
                    "Heavy Machinery and Equipment",
                    "Hazardous Materials",
                    "Cold Chain/Perishable Goods",
                    "Agricultural and Livestock Products",
                  ]}
                  error={errors?.itemCategory?.message}
                />
              )}
            />
            <TextInput
              label="Item Description"
              placeholder="Item Description"
              className="flex-1"
              {...register("itemDescription")}
              error={errors?.itemDescription?.message}
            />
            <Controller
              name="packagingType"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  name={name}
                  value={value}
                  onChange={onChange}
                  searchable
                  label="Packaging Type"
                  placeholder="Packaging Type"
                  data={[
                    "Pallets",
                    "Pieces",
                    "Boxes",
                    "Bundles",
                    "Crates",
                    "Totes",
                    "Other",
                    "None",
                  ]}
                  className="flex-1"
                  error={errors?.packagingType?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-2">
            <Controller
              name="quantity"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <NumberInput
                  name={name}
                  label="Quantity"
                  placeholder="Quantity"
                  value={value}
                  className="w-full"
                  onChange={onChange}
                  error={errors?.quantity?.message}
                />
              )}
            />
            <Box>
              <Text className="font-semibold">Dimension</Text>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Controller
                  name="dimension.length"
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <NumberInput
                      name={name}
                      placeholder="Length"
                      value={value}
                      className="w-full"
                      onChange={onChange}
                      error={errors?.dimension?.length?.message}
                    />
                  )}
                />
                <Controller
                  name="dimension.width"
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <NumberInput
                      name={name}
                      placeholder="Width"
                      value={value}
                      className="w-full"
                      onChange={onChange}
                      error={errors?.dimension?.width?.message}
                    />
                  )}
                />
                <Controller
                  name="dimension.height"
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <NumberInput
                      name={name}
                      placeholder="Height"
                      value={value}
                      className="w-full"
                      onChange={onChange}
                      error={errors?.dimension?.height?.message}
                    />
                  )}
                />
              </div>
            </Box>

            <Controller
              name="weight"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <NumberInput
                  name={name}
                  label="Weight"
                  placeholder="Weight"
                  value={value}
                  className="w-full"
                  onChange={onChange}
                  error={errors?.weight?.message}
                />
              )}
            />
            <Controller
              name="totalWeight"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <NumberInput
                  name={name}
                  label="Total Weight"
                  placeholder="Total Weight"
                  value={value}
                  className="w-full"
                  onChange={onChange}
                  error={errors?.totalWeight?.message}
                  disabled
                />
              )}
            />
          </div>
          {dropOffLocations?.length > 1 && (
            <Grid className="w-full mt-4">
              <Grid.Col span={{ xs: 12, sm: 6 }}>
                <Flex gap={10}>
                  <Select
                    label="Dropoff Location"
                    placeholder="Dropoff Location"
                    data={dropOffLocations?.map((location) => ({
                      value: location?.id?.toString(),
                      label: location?.dropoff_location,
                    }))}
                    onChange={(value) => handleSelectChange(value)}
                    className="w-full"
                  />

                  {selectedDropOffLocation && (
                    <NumberInput
                      label="Quantity"
                      placeholder="Quantity"
                      value={
                        locationSelected.find(
                          (loc) => loc.id === selectedDropOffLocation
                        )?.quantity || 0
                      }
                      onChange={handleQuantityChange}
                      max={maxItemQuantity}
                      className="w-full"
                    />
                  )}
                </Flex>
              </Grid.Col>

              <Grid.Col span={{ xs: 12, sm: 6 }}>
                {locationSelected?.map((location) => {
                  const selectedLocation = dropOffLocations.find(
                    (loc) => loc.id === location.id
                  );

                  return (
                    <div
                      key={location.id}
                      className="bg-gray-100 p-4 rounded-md mb-4 shadow-md mt-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-semibold text-gray-700">
                          {selectedLocation?.dropoff_location ||
                            "Unknown Location"}{" "}
                          {/* Display label */}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          Quantity: {location.quantity} {/* Display quantity */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Grid.Col>
            </Grid>
          )}

          <div className="w-full flex justify-end items-center gap-5 mt-6">
            <Button className="rounded-full px-10 " variant="default">
              Clear
            </Button>
            <Button
              className="rounded-full px-10 bg-gradient-to-r from-sky-300 to-blue-500"
              type="button"
              onClick={addToList}
            >
              Add More Item
            </Button>
          </div>
        </form>
        {/* table */}
        <div className="mt-5">
          {shipmentItems?.length > 0 && (
            <DataTable
              // height={150}
              columns={[
                {
                  accessor: "no",
                  title: "No.",
                  render: (records, index) => <>{index + 1}</>,
                },
                { accessor: "itemDescription", title: "Item Description" },
                { accessor: "itemCategory", title: "Item Category" },
                { accessor: "packagingType", title: "Packaging Type" },
                { accessor: "quantity" },
                {
                  accessor: "dimension",
                  title: "Dimension",
                  render: (records) => (
                    <Grid gap={2}>
                      <Grid.Col span={2}>{records.dimension.length}</Grid.Col>
                      <Grid.Col span={2}>X</Grid.Col>
                      <Grid.Col span={2}>{records.dimension.width}</Grid.Col>
                      <Grid.Col span={2}>X</Grid.Col>
                      <Grid.Col span={2}>{records.dimension.height}</Grid.Col>
                    </Grid>
                  ),
                },
                { accessor: "weight" },
                { accessor: "totalWeight" },
                {
                  accessor: "actions",
                  title: "",
                  width: "0%",
                  render: (records) => (
                    <Group gap={4} justify="right" wrap="nowrap">
                      <ActionIcon size="sm" variant="subtle" color="blue">
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="subtle" color="red">
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  ),
                },
              ]}
              records={shipmentItems ?? []}
            />
          )}
        </div>
      </div>
      <Flex justify="center" gap={10} mt="xl">
        <Button
          className="rounded-full px-10"
          variant="default"
          onClick={prevStep}
        >
          Back
        </Button>
        <Button
          className="rounded-full px-10 bg-gradient-to-r from-sky-300 to-blue-500"
          onClick={nextStepCalled}
        >
          Next
        </Button>
      </Flex>
    </div>
  );
}

export default CargoDescription;
