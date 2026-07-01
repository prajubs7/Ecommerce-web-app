import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCategories } from "../../api/categories";
import { useCreateProduct, useUpdateProduct } from "../../api/products";
import { uploadProductImage, deleteProductImage } from "../../api/storage";
import type { Product, ProductStatus } from "../../types/database.types";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
  categoryId: z.string().min(1, "Choose a category"),
  status: z.enum(["draft", "active", "archived"]),
});
type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  vendorId: string;
  product?: Product | null; // pass null/undefined for "create" mode
}

export default function ProductFormDialog({
  open,
  onClose,
  vendorId,
  product,
}: ProductFormDialogProps) {
  const isEditMode = !!product;
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, any, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: product?.title ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      categoryId: product?.category_id ?? "",
      status: (product?.status as ProductStatus) ?? "draft",
    },
  });

  // Reset form whenever the dialog opens for a different product (or fresh create)
  useEffect(() => {
    if (open) {
      reset({
        title: product?.title ?? "",
        description: product?.description ?? "",
        price: product?.price ?? 0,
        stock: product?.stock ?? 0,
        categoryId: product?.category_id ?? "",
        status: (product?.status as ProductStatus) ?? "draft",
      });
      setImages(product?.images ?? []);
      setFormError(null);
    }
  }, [open, product, reset]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const url = await uploadProductImage(file, vendorId);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  };

  const handleRemoveImage = async (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
    // Best-effort cleanup; don't block the UI on storage deletion succeeding
    deleteProductImage(url).catch(() => {});
  };

  const onSubmit = async (formData: FormData) => {
    setFormError(null);
    try {
      const payload = {
        title: formData.title,
        description: formData.description ?? "",
        price: formData.price,
        stock: formData.stock,
        category_id: formData.categoryId,
        status: formData.status,
        images,
        vendor_id: vendorId,
      };

      if (isEditMode && product) {
        await updateProduct.mutateAsync({ id: product.id, updates: payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save product",
      );
    }
  };

  const saving =
    isSubmitting || createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {isEditMode ? "Edit product" : "Add product"}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Title"
            margin="normal"
            {...register("title")}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
          <Stack direction="row" spacing={2} mb={2}>
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              minRows={3}
              {...register("description")}
            />
          </Stack>
          <Stack direction="row" spacing={2} mb={2}>
            <TextField
              label="Price ($)"
              type="number"
              margin="normal"
              fullWidth
              inputProps={{ step: "0.01", min: 0 }}
              {...register("price")}
              error={!!errors.price}
              helperText={errors.price?.message}
            />
            <TextField
              label="Stock"
              type="number"
              margin="normal"
              fullWidth
              inputProps={{ min: 0 }}
              {...register("stock")}
              error={!!errors.stock}
              helperText={errors.stock?.message}
            />
          </Stack>

          <Stack direction="row" spacing={2} mb={2}>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Category"
                  margin="normal"
                  fullWidth
                  error={!!errors.categoryId}
                  helperText={errors.categoryId?.message}
                  disabled={categoriesLoading}
                >
                  {categories?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Status"
                  margin="normal"
                  fullWidth
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">
                    Active (visible to shoppers)
                  </MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </TextField>
              )}
            />
          </Stack>

          <Typography
            variant="body2"
            sx={{ mt: 2, mb: 1 }}
            color="text.secondary"
          >
            Images
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {images.map((url) => (
              <Box key={url} sx={{ position: "relative" }}>
                <Box
                  component="img"
                  src={url}
                  alt="Product"
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    objectFit: "cover",
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveImage(url)}
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    "&:hover": { bgcolor: "background.paper" },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            <Button
              component="label"
              variant="outlined"
              sx={{
                width: 80,
                height: 80,
                minWidth: 0,
                flexDirection: "column",
                borderStyle: "dashed",
              }}
              disabled={uploading}
            >
              {uploading ? (
                <CircularProgress size={20} />
              ) : (
                <AddPhotoAlternateIcon />
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || uploading}
          >
            {saving
              ? "Saving…"
              : isEditMode
                ? "Save changes"
                : "Create product"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
