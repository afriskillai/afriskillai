import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ============================================================================
 * AFRISKILL AI — RESSOURCES PRIVÉES D'UNE FORMATION
 * ============================================================================
 *
 * Cette route conserve la compatibilité avec l'ancien système PDF tout en
 * ajoutant le nouveau système multi-fichiers CourseFile.
 *
 * Compatibilité historique :
 * - POST avec champ "pdf" => upload/remplacement de l'ancien PDF.
 * - DELETE sans fileId => suppression de l'ancien PDF.
 *
 * Nouveau système :
 * - GET => liste des fichiers privés.
 * - POST avec champ "files" => ajout d'un ou plusieurs PDF / Word / ZIP.
 * - DELETE ?fileId=... => suppression d'un CourseFile précis.
 *
 * Aucun fichier privé ne reçoit d'URL publique permanente.
 * Seul son chemin Supabase Storage est enregistré dans PostgreSQL.
 * ============================================================================
 */

const DEFAULT_BUCKET = "course-files";

const MAX_PDF_SIZE = 25 * 1024 * 1024;
const MAX_WORD_SIZE = 25 * 1024 * 1024;
const MAX_ZIP_SIZE = 100 * 1024 * 1024;

const MAX_FILES_PER_REQUEST = 20;
const MAX_FILES_PER_COURSE = 100;
const MAX_TOTAL_UPLOAD_SIZE = 250 * 1024 * 1024;

const PDF_MIME_TYPE = "application/pdf";

const WORD_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ZIP_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

type RouteContext = {
  params: Promise<{
    formationId: string;
  }>;
};

type CourseFileTypeValue = "PDF" | "WORD" | "ZIP";

type ValidatedCourseFile = {
  file: File;
  type: CourseFileTypeValue;
  extension: ".pdf" | ".doc" | ".docx" | ".zip";
  mimeType: string;
  originalFileName: string;
};

type UploadedStorageFile = {
  storagePath: string;
  validatedFile: ValidatedCourseFile;
};

type SupabaseStorageError = {
  statusCode?: string | number;
  error?: string;
  message?: string;
};

/**
 * ============================================================================
 * GET
 * ============================================================================
 *
 * Retourne les métadonnées des fichiers privés.
 *
 * IMPORTANT :
 * - aucun chemin Storage n'est exposé au client ;
 * - aucune URL signée n'est générée ici ;
 * - l'ancien PDF est signalé séparément pendant la période de transition.
 */

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formationId = await getFormationId(context);

  if (!formationId) {
    return errorResponse(
      "Identifiant de formation invalide.",
      400,
    );
  }

  try {
    const formation = await db.course.findUnique({
      where: {
        id: formationId,
      },

      select: {
        id: true,
        title: true,

        privatePdfPath: true,
        privatePdfName: true,
        privatePdfSize: true,

        files: {
          orderBy: [
            {
              position: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            id: true,
            type: true,
            name: true,
            size: true,
            mimeType: true,
            position: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!formation) {
      return errorResponse(
        "Formation introuvable.",
        404,
      );
    }

    return NextResponse.json(
      {
        success: true,

        formation: {
          id: formation.id,
          title: formation.title,
        },

        legacyPdf: formation.privatePdfPath
          ? {
              name:
                formation.privatePdfName ??
                "formation.pdf",

              size:
                formation.privatePdfSize ??
                null,

              hasPdf: true,
            }
          : null,

        files: formation.files.map((file) => ({
          id: file.id,
          type: file.type,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          position: file.position,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        })),

        totalFiles: formation.files.length,
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_FILES_GET]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * POST
 * ============================================================================
 *
 * Deux modes sont volontairement supportés.
 *
 * MODE HISTORIQUE
 * ---------------
 * champ multipart : pdf
 *
 * Conserve exactement le principe historique :
 * - un seul PDF ;
 * - remplacement de l'ancien PDF ;
 * - mise à jour privatePdf*.
 *
 * MODE MULTI-FICHIERS
 * -------------------
 * champ multipart : files
 *
 * Permet :
 * - plusieurs PDF ;
 * - plusieurs DOC ;
 * - plusieurs DOCX ;
 * - plusieurs ZIP.
 *
 * Les fichiers sont ajoutés sans remplacer les fichiers existants.
 */

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formationId = await getFormationId(context);

  if (!formationId) {
    return errorResponse(
      "Identifiant de formation invalide.",
      400,
    );
  }

  if (!isMultipartRequest(request)) {
    return errorResponse(
      "Les fichiers doivent être envoyés au format multipart/form-data.",
      415,
    );
  }

  const storageConfig = getStorageConfig();

  if (!storageConfig.ok) {
    console.error(
      "[ADMIN_FORMATION_FILES_CONFIG]",
      storageConfig.error,
    );

    return errorResponse(
      "Le stockage privé des formations n'est pas configuré.",
      500,
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      "Impossible de lire les fichiers envoyés.",
      400,
    );
  }

  /**
   * L'ancien formulaire envoie "pdf".
   * On conserve ce comportement sans modification.
   */
  const legacyPdfValue = formData.get("pdf");

  const multiFileValues = formData
    .getAll("files")
    .filter(
      (value): value is File =>
        value instanceof File &&
        value.size > 0,
    );

  /**
   * Compatibilité supplémentaire avec les clients qui utilisaient "file".
   *
   * Si "files" n'existe pas et qu'un seul "file" est envoyé,
   * on le traite comme une ressource multi-fichiers.
   */
  const genericFileValue = formData.get("file");

  if (
    multiFileValues.length === 0 &&
    genericFileValue instanceof File &&
    genericFileValue.size > 0
  ) {
    multiFileValues.push(genericFileValue);
  }

  /**
   * Priorité au nouveau mode lorsque "files" est explicitement utilisé.
   */
  if (multiFileValues.length > 0) {
    return handleMultipleFilesUpload({
      formationId,
      files: multiFileValues,
      storageConfig,
    });
  }

  /**
   * Sinon on conserve l'ancien upload PDF.
   */
  if (
    legacyPdfValue instanceof File &&
    legacyPdfValue.size > 0
  ) {
    return handleLegacyPdfUpload({
      formationId,
      file: legacyPdfValue,
      storageConfig,
    });
  }

  return validationError(
    "files",
    "Aucun fichier n'a été envoyé.",
  );
}

/**
 * ============================================================================
 * MULTI-FILES UPLOAD
 * ============================================================================
 */

async function handleMultipleFilesUpload(input: {
  formationId: string;
  files: File[];
  storageConfig: StorageConfigSuccess;
}) {
  if (input.files.length > MAX_FILES_PER_REQUEST) {
    return validationError(
      "files",
      `Vous pouvez ajouter au maximum ${MAX_FILES_PER_REQUEST} fichiers en une seule fois.`,
    );
  }

  const totalIncomingSize = input.files.reduce(
    (total, file) => total + file.size,
    0,
  );

  if (totalIncomingSize > MAX_TOTAL_UPLOAD_SIZE) {
    return validationError(
      "files",
      "La taille totale des fichiers envoyés est trop importante.",
    );
  }

  try {
    const formation = await db.course.findUnique({
      where: {
        id: input.formationId,
      },

      select: {
        id: true,
        title: true,

        _count: {
          select: {
            files: true,
          },
        },

        files: {
          orderBy: {
            position: "desc",
          },

          take: 1,

          select: {
            position: true,
          },
        },
      },
    });

    if (!formation) {
      return errorResponse(
        "Formation introuvable.",
        404,
      );
    }

    if (
      formation._count.files +
        input.files.length >
      MAX_FILES_PER_COURSE
    ) {
      return validationError(
        "files",
        `Une formation peut contenir au maximum ${MAX_FILES_PER_COURSE} fichiers privés.`,
      );
    }

    const validatedFiles: ValidatedCourseFile[] = [];

    /**
     * On valide TOUS les fichiers avant le premier upload.
     *
     * Ainsi, si le quatrième fichier est invalide, les trois premiers
     * ne sont pas inutilement envoyés dans Storage.
     */
    for (const file of input.files) {
      const validation =
        await validateCourseFile(file);

      if (!validation.ok) {
        return validationError(
          "files",
          validation.message,
        );
      }

      validatedFiles.push({
        file,
        type: validation.type,
        extension: validation.extension,
        mimeType: validation.mimeType,
        originalFileName:
          sanitizeOriginalFileName(
            file.name,
            validation.extension,
          ),
      });
    }

    const uploadedFiles: UploadedStorageFile[] = [];

    /**
     * ========================================================================
     * 1. STORAGE
     * ========================================================================
     */

    for (const validatedFile of validatedFiles) {
      const storageFileName =
        `${Date.now()}-${randomUUID()}` +
        validatedFile.extension;

      const storagePath =
        `formations/${formation.id}/resources/` +
        storageFileName;

      const bytes = new Uint8Array(
        await validatedFile.file.arrayBuffer(),
      );

      const uploadResult =
        await uploadPrivateFileToSupabase({
          supabaseUrl:
            input.storageConfig.supabaseUrl,

          secretKey:
            input.storageConfig.secretKey,

          bucket:
            input.storageConfig.bucket,

          storagePath,

          bytes,

          contentType:
            validatedFile.mimeType,
        });

      if (!uploadResult.ok) {
        console.error(
          "[ADMIN_FORMATION_FILE_UPLOAD]",
          {
            formationId: formation.id,
            fileName:
              validatedFile.originalFileName,
            error: uploadResult.error,
          },
        );

        /**
         * On retire tous les fichiers déjà envoyés pendant cette requête.
         */
        await rollbackUploadedFiles({
          storageConfig: input.storageConfig,
          storagePaths: uploadedFiles.map(
            (uploadedFile) =>
              uploadedFile.storagePath,
          ),
        });

        return errorResponse(
          `Impossible d'enregistrer le fichier « ${validatedFile.originalFileName} » dans le stockage privé.`,
          502,
        );
      }

      uploadedFiles.push({
        storagePath,
        validatedFile,
      });
    }

    /**
     * ========================================================================
     * 2. POSTGRESQL
     * ========================================================================
     */

    const currentHighestPosition =
      formation.files[0]?.position ?? -1;

    let createdFiles: Array<{
      id: string;
      type: CourseFileTypeValue;
      name: string;
      size: number;
      mimeType: string | null;
      position: number;
      createdAt: Date;
      updatedAt: Date;
    }>;

    try {
      createdFiles = await db.$transaction(
        async (transaction) => {
          const results: Array<{
            id: string;
            type: CourseFileTypeValue;
            name: string;
            size: number;
            mimeType: string | null;
            position: number;
            createdAt: Date;
            updatedAt: Date;
          }> = [];

          for (
            let index = 0;
            index < uploadedFiles.length;
            index += 1
          ) {
            const uploadedFile =
              uploadedFiles[index];

            const created =
              await transaction.courseFile.create({
                data: {
                  courseId: formation.id,

                  type:
                    uploadedFile.validatedFile.type,

                  name:
                    uploadedFile.validatedFile
                      .originalFileName,

                  path:
                    uploadedFile.storagePath,

                  size:
                    uploadedFile.validatedFile.file
                      .size,

                  mimeType:
                    uploadedFile.validatedFile
                      .mimeType,

                  position:
                    currentHighestPosition +
                    index +
                    1,
                },

                select: {
                  id: true,
                  type: true,
                  name: true,
                  size: true,
                  mimeType: true,
                  position: true,
                  createdAt: true,
                  updatedAt: true,
                },
              });

            results.push(created);
          }

          return results;
        },
      );
    } catch (databaseError) {
      /**
       * PostgreSQL a refusé l'enregistrement.
       *
       * Les objets Storage envoyés pendant cette requête doivent être retirés.
       */
      await rollbackUploadedFiles({
        storageConfig: input.storageConfig,
        storagePaths: uploadedFiles.map(
          (uploadedFile) =>
            uploadedFile.storagePath,
        ),
      });

      throw databaseError;
    }

    return NextResponse.json(
      {
        success: true,

        message:
          createdFiles.length === 1
            ? "Le fichier privé a été ajouté avec succès."
            : `${createdFiles.length} fichiers privés ont été ajoutés avec succès.`,

        files: createdFiles.map((file) => ({
          id: file.id,
          type: file.type,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          position: file.position,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        })),

        addedCount: createdFiles.length,
      },
      {
        status: 201,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_FILES_POST]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * LEGACY PDF UPLOAD
 * ============================================================================
 *
 * Conserve l'ancien fonctionnement pendant la migration.
 */

async function handleLegacyPdfUpload(input: {
  formationId: string;
  file: File;
  storageConfig: StorageConfigSuccess;
}) {
  try {
    const formation = await db.course.findUnique({
      where: {
        id: input.formationId,
      },

      select: {
        id: true,
        title: true,
        privatePdfPath: true,
        privatePdfName: true,
        privatePdfSize: true,
      },
    });

    if (!formation) {
      return errorResponse(
        "Formation introuvable.",
        404,
      );
    }

    const validation =
      await validateCourseFile(input.file);

    if (!validation.ok) {
      return validationError(
        "pdf",
        validation.message,
      );
    }

    if (validation.type !== "PDF") {
      return validationError(
        "pdf",
        "Le fichier historique doit être un PDF.",
      );
    }

    const originalFileName =
      sanitizeOriginalFileName(
        input.file.name,
        ".pdf",
      );

    const storageFileName =
      `${Date.now()}-${randomUUID()}.pdf`;

    /**
     * On conserve volontairement l'ancien chemin pour compatibilité.
     */
    const storagePath =
      `formations/${formation.id}/` +
      storageFileName;

    const bytes = new Uint8Array(
      await input.file.arrayBuffer(),
    );

    const uploadResult =
      await uploadPrivateFileToSupabase({
        supabaseUrl:
          input.storageConfig.supabaseUrl,

        secretKey:
          input.storageConfig.secretKey,

        bucket:
          input.storageConfig.bucket,

        storagePath,

        bytes,

        contentType: PDF_MIME_TYPE,
      });

    if (!uploadResult.ok) {
      console.error(
        "[ADMIN_FORMATION_PDF_UPLOAD]",
        uploadResult.error,
      );

      return errorResponse(
        "Impossible d'enregistrer le PDF dans le stockage privé.",
        502,
      );
    }

    let updatedFormation: {
      id: string;
      title: string;
      privatePdfPath: string | null;
      privatePdfName: string | null;
      privatePdfSize: number | null;
      updatedAt: Date;
    };

    try {
      updatedFormation =
        await db.course.update({
          where: {
            id: formation.id,
          },

          data: {
            privatePdfPath: storagePath,
            privatePdfName:
              originalFileName,
            privatePdfSize:
              input.file.size,
          },

          select: {
            id: true,
            title: true,
            privatePdfPath: true,
            privatePdfName: true,
            privatePdfSize: true,
            updatedAt: true,
          },
        });
    } catch (databaseError) {
      await deletePrivateFilesFromSupabase({
        supabaseUrl:
          input.storageConfig.supabaseUrl,

        secretKey:
          input.storageConfig.secretKey,

        bucket:
          input.storageConfig.bucket,

        storagePaths: [storagePath],
      });

      throw databaseError;
    }

    /**
     * L'ancien PDF n'est retiré qu'après :
     * - upload réussi ;
     * - mise à jour PostgreSQL réussie.
     */
    if (
      formation.privatePdfPath &&
      formation.privatePdfPath !==
        storagePath
    ) {
      const deleteOldResult =
        await deletePrivateFilesFromSupabase({
          supabaseUrl:
            input.storageConfig.supabaseUrl,

          secretKey:
            input.storageConfig.secretKey,

          bucket:
            input.storageConfig.bucket,

          storagePaths: [
            formation.privatePdfPath,
          ],
        });

      if (!deleteOldResult.ok) {
        console.error(
          "[ADMIN_FORMATION_OLD_PDF_DELETE_FAILED]",
          {
            formationId:
              formation.id,

            oldPath:
              formation.privatePdfPath,

            error:
              deleteOldResult.error,
          },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,

        message:
          formation.privatePdfPath
            ? "Le PDF privé de la formation a été remplacé avec succès."
            : "Le PDF privé de la formation a été ajouté avec succès.",

        pdf: {
          name:
            updatedFormation.privatePdfName,

          size:
            updatedFormation.privatePdfSize,

          hasPdf: Boolean(
            updatedFormation.privatePdfPath,
          ),

          updatedAt:
            updatedFormation.updatedAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_PDF_POST]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * DELETE
 * ============================================================================
 *
 * Nouveau système :
 * DELETE ?fileId=xxx
 *
 * Ancien système :
 * DELETE sans fileId
 */

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formationId = await getFormationId(context);

  if (!formationId) {
    return errorResponse(
      "Identifiant de formation invalide.",
      400,
    );
  }

  const storageConfig = getStorageConfig();

  if (!storageConfig.ok) {
    console.error(
      "[ADMIN_FORMATION_FILES_CONFIG]",
      storageConfig.error,
    );

    return errorResponse(
      "Le stockage privé des formations n'est pas configuré.",
      500,
    );
  }

  const requestUrl = new URL(request.url);

  const fileId = cleanString(
    requestUrl.searchParams.get("fileId"),
  );

  if (fileId) {
    return deleteCourseFile({
      formationId,
      fileId,
      storageConfig,
    });
  }

  return deleteLegacyPdf({
    formationId,
    storageConfig,
  });
}

/**
 * ============================================================================
 * DELETE COURSE FILE
 * ============================================================================
 */

async function deleteCourseFile(input: {
  formationId: string;
  fileId: string;
  storageConfig: StorageConfigSuccess;
}) {
  try {
    /**
     * Le courseId fait partie de la recherche.
     *
     * Un identifiant de fichier appartenant à une autre formation
     * ne peut donc jamais être supprimé via cette route.
     */
    const file = await db.courseFile.findFirst({
      where: {
        id: input.fileId,
        courseId: input.formationId,
      },

      select: {
        id: true,
        courseId: true,
        name: true,
        path: true,
      },
    });

    if (!file) {
      return errorResponse(
        "Fichier privé introuvable.",
        404,
      );
    }

    /**
     * PostgreSQL est mis à jour en premier.
     *
     * Dès que cette suppression réussit, le fichier ne fait plus partie
     * des ressources actives de la formation.
     */
    await db.courseFile.delete({
      where: {
        id: file.id,
      },
    });

    const deleteResult =
      await deletePrivateFilesFromSupabase({
        supabaseUrl:
          input.storageConfig.supabaseUrl,

        secretKey:
          input.storageConfig.secretKey,

        bucket:
          input.storageConfig.bucket,

        storagePaths: [
          file.path,
        ],
      });

    if (!deleteResult.ok) {
      console.error(
        "[ADMIN_FORMATION_FILE_DELETE_STORAGE_FAILED]",
        {
          formationId:
            input.formationId,

          fileId:
            file.id,

          path:
            file.path,

          error:
            deleteResult.error,
        },
      );

      return NextResponse.json(
        {
          success: true,

          message:
            "Le fichier a été retiré de la formation. Le nettoyage du stockage devra être réessayé.",

          deletedFileId:
            file.id,

          storageCleanupPending: true,
        },
        {
          status: 200,
          headers: noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          `Le fichier « ${file.name} » a été supprimé avec succès.`,

        deletedFileId:
          file.id,

        storageCleanupPending: false,
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_FILE_DELETE]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * DELETE LEGACY PDF
 * ============================================================================
 */

async function deleteLegacyPdf(input: {
  formationId: string;
  storageConfig: StorageConfigSuccess;
}) {
  try {
    const formation = await db.course.findUnique({
      where: {
        id: input.formationId,
      },

      select: {
        id: true,
        privatePdfPath: true,
      },
    });

    if (!formation) {
      return errorResponse(
        "Formation introuvable.",
        404,
      );
    }

    if (!formation.privatePdfPath) {
      return NextResponse.json(
        {
          success: true,

          message:
            "Aucun PDF privé historique n'est associé à cette formation.",

          storageCleanupPending: false,
        },
        {
          status: 200,
          headers: noStoreHeaders(),
        },
      );
    }

    const oldPath =
      formation.privatePdfPath;

    await db.course.update({
      where: {
        id: formation.id,
      },

      data: {
        privatePdfPath: null,
        privatePdfName: null,
        privatePdfSize: null,
      },
    });

    const deleteResult =
      await deletePrivateFilesFromSupabase({
        supabaseUrl:
          input.storageConfig.supabaseUrl,

        secretKey:
          input.storageConfig.secretKey,

        bucket:
          input.storageConfig.bucket,

        storagePaths: [
          oldPath,
        ],
      });

    if (!deleteResult.ok) {
      console.error(
        "[ADMIN_FORMATION_PDF_DELETE_STORAGE_FAILED]",
        {
          formationId:
            formation.id,

          path:
            oldPath,

          error:
            deleteResult.error,
        },
      );

      return NextResponse.json(
        {
          success: true,

          message:
            "Le PDF a été retiré de la formation. Le nettoyage du stockage devra être réessayé.",

          storageCleanupPending: true,
        },
        {
          status: 200,
          headers: noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "Le PDF privé historique a été supprimé avec succès.",

        storageCleanupPending: false,
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_PDF_DELETE]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * FILE VALIDATION
 * ============================================================================
 */

async function validateCourseFile(
  file: File,
): Promise<
  | {
      ok: true;
      type: CourseFileTypeValue;
      extension:
        | ".pdf"
        | ".doc"
        | ".docx"
        | ".zip";
      mimeType: string;
    }
  | {
      ok: false;
      message: string;
    }
> {
  if (file.size <= 0) {
    return {
      ok: false,
      message:
        "Le fichier envoyé est vide.",
    };
  }

  const fileName =
    file.name.trim().toLowerCase();

  const extension =
    getSupportedExtension(fileName);

  if (!extension) {
    return {
      ok: false,
      message:
        "Format non autorisé. Les formats acceptés sont PDF, DOC, DOCX et ZIP.",
    };
  }

  const type =
    getCourseFileType(extension);

  const maxSize =
    getMaximumFileSize(type);

  if (file.size > maxSize) {
    return {
      ok: false,

      message:
        type === "ZIP"
          ? `Le fichier « ${file.name} » ne doit pas dépasser 100 Mo.`
          : `Le fichier « ${file.name} » ne doit pas dépasser 25 Mo.`,
    };
  }

  const mimeValidation =
    validateMimeType(
      file.type,
      extension,
    );

  if (!mimeValidation.ok) {
    return mimeValidation;
  }

  /**
   * On vérifie également la signature binaire.
   *
   * Modifier uniquement l'extension du fichier ne suffit donc pas.
   */
  const signatureValidation =
    await validateFileSignature(
      file,
      extension,
    );

  if (!signatureValidation.ok) {
    return signatureValidation;
  }

  return {
    ok: true,
    type,
    extension,
    mimeType:
      normalizeMimeType(
        file.type,
        extension,
      ),
  };
}

function getSupportedExtension(
  fileName: string,
):
  | ".pdf"
  | ".doc"
  | ".docx"
  | ".zip"
  | null {
  if (fileName.endsWith(".pdf")) {
    return ".pdf";
  }

  if (fileName.endsWith(".docx")) {
    return ".docx";
  }

  if (fileName.endsWith(".doc")) {
    return ".doc";
  }

  if (fileName.endsWith(".zip")) {
    return ".zip";
  }

  return null;
}

function getCourseFileType(
  extension:
    | ".pdf"
    | ".doc"
    | ".docx"
    | ".zip",
): CourseFileTypeValue {
  switch (extension) {
    case ".pdf":
      return "PDF";

    case ".doc":
    case ".docx":
      return "WORD";

    case ".zip":
      return "ZIP";
  }
}

function getMaximumFileSize(
  type: CourseFileTypeValue,
) {
  switch (type) {
    case "PDF":
      return MAX_PDF_SIZE;

    case "WORD":
      return MAX_WORD_SIZE;

    case "ZIP":
      return MAX_ZIP_SIZE;
  }
}

/**
 * ============================================================================
 * MIME VALIDATION
 * ============================================================================
 */

function validateMimeType(
  mimeType: string,
  extension:
    | ".pdf"
    | ".doc"
    | ".docx"
    | ".zip",
):
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    } {
  /**
   * Certains navigateurs peuvent envoyer un MIME vide.
   *
   * Cela reste accepté uniquement parce que la signature réelle du fichier
   * est également vérifiée.
   */
  if (!mimeType) {
    return {
      ok: true,
    };
  }

  const normalized =
    mimeType.trim().toLowerCase();

  if (
    extension === ".pdf" &&
    normalized !== PDF_MIME_TYPE
  ) {
    return {
      ok: false,
      message:
        "Le fichier PDF possède un type MIME invalide.",
    };
  }

  if (
    (extension === ".doc" ||
      extension === ".docx") &&
    !WORD_MIME_TYPES.has(normalized) &&
    normalized !==
      "application/octet-stream"
  ) {
    return {
      ok: false,
      message:
        "Le document Word possède un type MIME invalide.",
    };
  }

  if (
    extension === ".zip" &&
    !ZIP_MIME_TYPES.has(normalized)
  ) {
    return {
      ok: false,
      message:
        "Le fichier ZIP possède un type MIME invalide.",
    };
  }

  return {
    ok: true,
  };
}

function normalizeMimeType(
  mimeType: string,
  extension:
    | ".pdf"
    | ".doc"
    | ".docx"
    | ".zip",
) {
  const normalized =
    mimeType.trim().toLowerCase();

  if (normalized) {
    return normalized;
  }

  switch (extension) {
    case ".pdf":
      return PDF_MIME_TYPE;

    case ".doc":
      return "application/msword";

    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    case ".zip":
      return "application/zip";
  }
}

/**
 * ============================================================================
 * BINARY SIGNATURE VALIDATION
 * ============================================================================
 */

async function validateFileSignature(
  file: File,
  extension:
    | ".pdf"
    | ".doc"
    | ".docx"
    | ".zip",
): Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    }
> {
  const headerBuffer =
    await file
      .slice(0, 8)
      .arrayBuffer();

  const header =
    new Uint8Array(headerBuffer);

  if (extension === ".pdf") {
    const valid =
      header.length >= 5 &&
      header[0] === 0x25 &&
      header[1] === 0x50 &&
      header[2] === 0x44 &&
      header[3] === 0x46 &&
      header[4] === 0x2d;

    return valid
      ? {
          ok: true,
        }
      : {
          ok: false,
          message:
            `Le fichier « ${file.name} » n'est pas un PDF valide.`,
        };
  }

  if (extension === ".doc") {
    /**
     * Ancien format Microsoft Compound File Binary Format.
     *
     * Signature :
     * D0 CF 11 E0 A1 B1 1A E1
     */
    const valid =
      header.length >= 8 &&
      header[0] === 0xd0 &&
      header[1] === 0xcf &&
      header[2] === 0x11 &&
      header[3] === 0xe0 &&
      header[4] === 0xa1 &&
      header[5] === 0xb1 &&
      header[6] === 0x1a &&
      header[7] === 0xe1;

    return valid
      ? {
          ok: true,
        }
      : {
          ok: false,
          message:
            `Le fichier « ${file.name} » n'est pas un document Word .doc valide.`,
        };
  }

  /**
   * DOCX et ZIP sont tous les deux des conteneurs ZIP.
   *
   * Signatures ZIP courantes :
   * - 50 4B 03 04
   * - 50 4B 05 06
   * - 50 4B 07 08
   */
  const validZipSignature =
    header.length >= 4 &&
    header[0] === 0x50 &&
    header[1] === 0x4b &&
    (
      (
        header[2] === 0x03 &&
        header[3] === 0x04
      ) ||
      (
        header[2] === 0x05 &&
        header[3] === 0x06
      ) ||
      (
        header[2] === 0x07 &&
        header[3] === 0x08
      )
    );

  if (!validZipSignature) {
    return {
      ok: false,

      message:
        extension === ".docx"
          ? `Le fichier « ${file.name} » n'est pas un document Word .docx valide.`
          : `Le fichier « ${file.name} » n'est pas une archive ZIP valide.`,
    };
  }

  return {
    ok: true,
  };
}

/**
 * ============================================================================
 * FILE NAME
 * ============================================================================
 */

function sanitizeOriginalFileName(
  fileName: string,
  extension:
    | ".pdf"
    | ".doc"
    | ".docx"
    | ".zip",
) {
  const trimmed =
    fileName.trim();

  const fallback =
    `ressource${extension}`;

  if (!trimmed) {
    return fallback;
  }

  /**
   * Retrait :
   * - caractères de contrôle ;
   * - slash ;
   * - backslash ;
   * - caractères susceptibles de manipuler un chemin.
   */
  const sanitized = trimmed
    .replace(
      /[\u0000-\u001F\u007F]/g,
      "",
    )
    .replace(/[\\/]/g, "-")
    .trim()
    .slice(0, 255);

  if (!sanitized) {
    return fallback;
  }

  if (
    sanitized
      .toLowerCase()
      .endsWith(extension)
  ) {
    return sanitized;
  }

  return `${sanitized}${extension}`;
}

/**
 * ============================================================================
 * SUPABASE CONFIG
 * ============================================================================
 */

type StorageConfigSuccess = {
  ok: true;
  supabaseUrl: string;
  secretKey: string;
  bucket: string;
};

function getStorageConfig():
  | StorageConfigSuccess
  | {
      ok: false;
      error: string;
    } {
  const supabaseUrl =
    cleanString(
      process.env.SUPABASE_URL,
    ).replace(/\/+$/, "");

  const secretKey =
    cleanString(
      process.env.SUPABASE_SECRET_KEY,
    );

  const bucket =
    cleanString(
      process.env
        .SUPABASE_COURSE_FILES_BUCKET,
    ) || DEFAULT_BUCKET;

  if (!supabaseUrl) {
    return {
      ok: false,
      error:
        "SUPABASE_URL est manquant.",
    };
  }

  if (!isHttpsUrl(supabaseUrl)) {
    return {
      ok: false,
      error:
        "SUPABASE_URL est invalide.",
    };
  }

  if (!secretKey) {
    return {
      ok: false,
      error:
        "SUPABASE_SECRET_KEY est manquant.",
    };
  }

  if (!bucket) {
    return {
      ok: false,
      error:
        "SUPABASE_COURSE_FILES_BUCKET est manquant.",
    };
  }

  return {
    ok: true,
    supabaseUrl,
    secretKey,
    bucket,
  };
}

/**
 * ============================================================================
 * SUPABASE — UPLOAD
 * ============================================================================
 */

async function uploadPrivateFileToSupabase(
  input: {
    supabaseUrl: string;
    secretKey: string;
    bucket: string;
    storagePath: string;
    bytes: Uint8Array;
    contentType: string;
  },
): Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
      error: SupabaseStorageError;
    }
> {
  const endpoint =
    createSupabaseObjectEndpoint(
      input.supabaseUrl,
      input.bucket,
      input.storagePath,
    );

  try {
    const response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${input.secretKey}`,

          apikey:
            input.secretKey,

          "Content-Type":
            input.contentType,

          "x-upsert": "false",

          "Cache-Control":
            "no-store",
        },

        body:
          Buffer.from(input.bytes),

        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        ok: false,

        error:
          await readSupabaseError(
            response,
          ),
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,

      error: {
        error:
          "STORAGE_NETWORK_ERROR",

        message:
          error instanceof Error
            ? error.message
            : "Erreur réseau inconnue.",
      },
    };
  }
}

/**
 * ============================================================================
 * SUPABASE — DELETE
 * ============================================================================
 */

async function deletePrivateFilesFromSupabase(
  input: {
    supabaseUrl: string;
    secretKey: string;
    bucket: string;
    storagePaths: string[];
  },
): Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
      error: SupabaseStorageError;
    }
> {
  const uniqueStoragePaths =
    Array.from(
      new Set(
        input.storagePaths
          .map((path) => path.trim())
          .filter(Boolean),
      ),
    );

  if (uniqueStoragePaths.length === 0) {
    return {
      ok: true,
    };
  }

  const endpoint =
    `${input.supabaseUrl}` +
    `/storage/v1/object/${encodeURIComponent(
      input.bucket,
    )}`;

  try {
    const response = await fetch(
      endpoint,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${input.secretKey}`,

          apikey:
            input.secretKey,

          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-store",
        },

        body: JSON.stringify({
          prefixes:
            uniqueStoragePaths,
        }),

        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        ok: false,

        error:
          await readSupabaseError(
            response,
          ),
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,

      error: {
        error:
          "STORAGE_NETWORK_ERROR",

        message:
          error instanceof Error
            ? error.message
            : "Erreur réseau inconnue.",
      },
    };
  }
}

async function rollbackUploadedFiles(
  input: {
    storageConfig: StorageConfigSuccess;
    storagePaths: string[];
  },
) {
  if (input.storagePaths.length === 0) {
    return;
  }

  const rollbackResult =
    await deletePrivateFilesFromSupabase({
      supabaseUrl:
        input.storageConfig.supabaseUrl,

      secretKey:
        input.storageConfig.secretKey,

      bucket:
        input.storageConfig.bucket,

      storagePaths:
        input.storagePaths,
    });

  if (!rollbackResult.ok) {
    console.error(
      "[ADMIN_FORMATION_FILES_ROLLBACK_FAILED]",
      rollbackResult.error,
    );
  }
}

/**
 * ============================================================================
 * SUPABASE — URL
 * ============================================================================
 */

function createSupabaseObjectEndpoint(
  supabaseUrl: string,
  bucket: string,
  storagePath: string,
) {
  const encodedBucket =
    encodeURIComponent(bucket);

  const encodedPath =
    storagePath
      .split("/")
      .map((segment) =>
        encodeURIComponent(segment),
      )
      .join("/");

  return (
    `${supabaseUrl}` +
    `/storage/v1/object/` +
    `${encodedBucket}/` +
    `${encodedPath}`
  );
}

/**
 * ============================================================================
 * SUPABASE — ERROR
 * ============================================================================
 */

async function readSupabaseError(
  response: Response,
): Promise<SupabaseStorageError> {
  try {
    const payload =
      (await response.json()) as
        SupabaseStorageError;

    return {
      statusCode:
        payload.statusCode ??
        response.status,

      error:
        payload.error ??
        "SUPABASE_STORAGE_ERROR",

      message:
        payload.message ??
        response.statusText,
    };
  } catch {
    return {
      statusCode:
        response.status,

      error:
        "SUPABASE_STORAGE_ERROR",

      message:
        response.statusText ||
        "Erreur Supabase Storage.",
    };
  }
}

/**
 * ============================================================================
 * ROUTE PARAMS
 * ============================================================================
 */

async function getFormationId(
  context: RouteContext,
) {
  try {
    const params =
      await context.params;

    return cleanString(
      params.formationId,
    );
  } catch {
    return "";
  }
}

/**
 * ============================================================================
 * REQUEST
 * ============================================================================
 */

function isMultipartRequest(
  request: Request,
) {
  return (
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes(
        "multipart/form-data",
      ) ?? false
  );
}

/**
 * ============================================================================
 * URL VALIDATION
 * ============================================================================
 */

function isHttpsUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

/**
 * ============================================================================
 * STRING
 * ============================================================================
 */

function cleanString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * ============================================================================
 * RESPONSES
 * ============================================================================
 */

function validationError(
  field: string,
  message: string,
) {
  return NextResponse.json(
    {
      success: false,
      message,

      fieldErrors: {
        [field]: message,
      },
    },
    {
      status: 400,
      headers: noStoreHeaders(),
    },
  );
}

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

function unauthorized() {
  return errorResponse(
    "Authentification administrateur requise.",
    401,
  );
}

function serverError() {
  return errorResponse(
    "Une erreur interne est survenue.",
    500,
  );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, no-cache, must-revalidate, max-age=0",

    Pragma:
      "no-cache",

    Expires:
      "0",
  };
}