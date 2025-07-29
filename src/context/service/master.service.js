import { apiSlice } from "./api.service";

export const masterApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createMaster: builder.mutation({
      query: (body) => ({
        url: "/master",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Master"],
    }),

    getMasters: builder.query({
      query: () => ({
        url: "/masters",
        method: "GET",
      }),
      providesTags: ["Master"],
    }),

    createCarToMaster: builder.mutation({
      query: ({ master_id, car }) => ({
        url: `/master/${master_id}/car`,
        method: "POST",
        body: car,
      }),
      invalidatesTags: ["Master"],
    }),

    createSaleToCar: builder.mutation({
      query: ({ master_id, car_id, sale }) => ({
        url: `/master/${master_id}/car/${car_id}/sale`,
        method: "POST",
        body: sale,
      }),
      invalidatesTags: ["Master", "Sales"],
    }),

    createPaymentToMaster: builder.mutation({
      query: ({ master_id, car_id, payment }) => ({
        url: `/master/${master_id}/payment`,
        method: "POST",
        body: { car_id, ...payment },
      }),
      invalidatesTags: ["Master"],
    }),

    deleteMaster: builder.mutation({
      query: ({ master_id }) => ({
        url: `/master/${master_id}/delete`,
        method: "DELETE",
      }),
      invalidatesTags: ["Master"],
    }),

    // 🔻 YANGI: Mashina o‘chirish mutation
    deleteCarFromMaster: builder.mutation({
      query: ({ master_id, car_id }) => ({
        url: `/master/${master_id}/cars/${car_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Master"],
    }),
  }),
});

export const {
  useCreateMasterMutation,
  useGetMastersQuery,
  useCreateCarToMasterMutation,
  useCreateSaleToCarMutation,
  useCreatePaymentToMasterMutation,
  useDeleteMasterMutation,
  useDeleteCarFromMasterMutation, // 🔻 YANGI export
} = masterApi;
