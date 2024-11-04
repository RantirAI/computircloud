import {
  AddPieceRequestBody,
  ApFlagId,
  PackageType,
  PieceScope,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { piecesApi } from '../lib/pieces-api';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';

const FormSchema = Type.Object({
  pieceName: Type.String({
    errorMessage: t('Please enter a piece name'),
  }),
  scope: Type.Enum(PieceScope, {
    errorMessage: t('Please select a scope'),
  }),
  pieceVersion: Type.String({
    errorMessage: t('Please enter a piece version'),
  }),
  packageType: Type.Enum(PackageType, {
    errorMessage: t('Please select a package type'),
  }),
  pieceArchive: Type.Optional(Type.Any()),
});

type InstallPieceDialogProps = {
  onInstallPiece: () => void;
  scope: PieceScope;
};
const InstallPieceDialog = ({
  onInstallPiece,
  scope,
}: InstallPieceDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: privatePiecesEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.PRIVATE_PIECES_ENABLED,
  );

  const form = useForm<Static<typeof FormSchema>>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      scope,
      packageType: PackageType.REGISTRY,
    },
  });

  const { mutate, isPending } = useMutation<void, Error, AddPieceRequestBody>({
    mutationFn: async (data) => {
      form.setError('root.serverError', {
        message: undefined,
      });
      await piecesApi.install(data);
    },
    onSuccess: () => {
      setIsOpen(false);
      form.reset();
      onInstallPiece();
      toast({
        title: t('Success'),
        description: t('Piece installed'),
        duration: 3000,
      });
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Conflict:
            form.setError('root.serverError', {
              message: t('Piece already installed.'),
            });
            break;
          default:
            form.setError('root.serverError', {
              message: t('Something went wrong, please try again later'),
            });
            break;
        }
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center justify-center gap-2">
          <Plus className="size-4" />
          {t('Install Piece')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Install a piece')}</DialogTitle>
          <DialogDescription>
            <ApMarkdown
              markdown={
                'Use this to install a [custom piece]("https://www.activepieces.com/docs/developers/building-pieces/create-action") that you (or someone else) created. Once the piece is installed, you can use it in the flow builder.\n\nWarning: Make sure you trust the author as the piece will have access to your flow data and it might not be compatible with the current version of Computir.'
              }
            />
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((data) => mutate(data))}
          >
            <FormField
              name="pieceName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="pieceName">{t('Piece Name')}</FormLabel>
                  <Input
                    {...field}
                    required
                    id="pieceName"
                    type="text"
                    placeholder="@computir/node-name"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="pieceVersion"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="pieceVersion">
                    {t('Piece Version')}
                  </FormLabel>
                  <Input
                    {...field}
                    required
                    id="pieceVersion"
                    type="text"
                    placeholder="0.0.1"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="packageType"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="packageType">
                    {t('Package Type')}
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={PackageType.REGISTRY}
                  >
                    <SelectTrigger>
                      <SelectValue defaultValue={PackageType.REGISTRY} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={PackageType.REGISTRY}>
                          {t('NPM Registry')}
                        </SelectItem>
                        {privatePiecesEnabled && (
                          <SelectItem value={PackageType.ARCHIVE}>
                            {t('Packed Archive (.tgz)')}
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {form.watch('packageType') === PackageType.ARCHIVE && (
              <FormField
                name="pieceArchive"
                control={form.control}
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel htmlFor="pieceArchive">
                      {t('Package Archive')}
                    </FormLabel>
                    <Input
                      {...fieldProps}
                      id="pieceArchive"
                      type="file"
                      onChange={(event) => {
                        onChange(event.target.files && event.target.files[0]);
                      }}
                      placeholder={t('Package archive')}
                      className="rounded-sm"
                    />
                  </FormItem>
                )}
              />
            )}
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <Button loading={isPending} type="submit">
              {t('Install')}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export { InstallPieceDialog };
