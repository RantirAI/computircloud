import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import React, { useState } from 'react';

import { CreateOrEditConnectionDialog } from './create-edit-connection-dialog';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';

type NewConnectionDialogProps = {
  onConnectionCreated: (res: { name: string; id: string }) => void;
  children: React.ReactNode;
};

const NewConnectionDialog = React.memo(
  ({ onConnectionCreated, children }: NewConnectionDialogProps) => {
    const [dialogTypesOpen, setDialogTypesOpen] = useState(false);
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
    const [selectedPiece, setSelectedPiece] = useState<
      PieceMetadataModelSummary | undefined
    >(undefined);
    const { pieces, isLoading } = piecesHooks.usePieces({});
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPieces = pieces?.filter((piece) => {
      return (
        !isNil(piece.auth) &&
        piece.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    const clickPiece = (name: string) => {
      setDialogTypesOpen(false);
      setSelectedPiece(pieces?.find((piece) => piece.name === name));
      setConnectionDialogOpen(true);
    };

    return (
      <>
        {selectedPiece && (
          <CreateOrEditConnectionDialog
            reconnectConnection={null}
            piece={selectedPiece}
            predefinedConnectionName={null}
            open={connectionDialogOpen}
            onConnectionCreated={onConnectionCreated}
            setOpen={setConnectionDialogOpen}
          ></CreateOrEditConnectionDialog>
        )}
        <Dialog
          open={dialogTypesOpen}
          onOpenChange={(open) => {
            setDialogTypesOpen(open);
            setSearchTerm('');
          }}
        >
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="min-w-[700px] max-w-[700px] h-[680px] max-h-[680px] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t('New Connection')}</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <Input
                placeholder={t('Search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ScrollArea className="flex-grow overflow-y-auto ">
              <div className="grid grid-cols-4 gap-4">
                {(isLoading ||
                  (filteredPieces && filteredPieces.length === 0)) && (
                  <div className="text-center">{t('No pieces found')}</div>
                )}
                {!isLoading &&
                  filteredPieces &&
                  filteredPieces.map((piece, index) => (
                    <div
                      key={index}
                      onClick={() => clickPiece(piece.name)}
                      className="border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg"
                    >
                      <img
                        className="w-[40px] h-[40px]"
                        src={piece.logoUrl}
                      ></img>
                      <div className="mt-2 text-center text-md">
                        {/* {piece.displayName} */}
                        Computir
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t('Close')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

NewConnectionDialog.displayName = 'NewConnectionDialog';
export { NewConnectionDialog };
