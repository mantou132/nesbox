import { updateStore } from '@mantou/gem';
import { Toast } from 'duoyun-ui/elements/toast';
import { debounce } from 'duoyun-ui/lib/utils';
import { isNotNullish } from 'duoyun-ui/lib/types';

import {
  AcceptFriend,
  AcceptFriendMutation,
  AcceptFriendMutationVariables,
  AcceptInvite,
  AcceptInviteMutation,
  AcceptInviteMutationVariables,
  ApplyFriend,
  ApplyFriendMutation,
  ApplyFriendMutationVariables,
  CreateComment,
  CreateCommentMutation,
  CreateCommentMutationVariables,
  CreateInvite,
  CreateInviteMutation,
  CreateInviteMutationVariables,
  CreateMessage,
  CreateMessageMutation,
  CreateMessageMutationVariables,
  CreateRoom,
  CreateRoomMutation,
  CreateRoomMutationVariables,
  EnterPubRoom,
  EnterPubRoomMutation,
  EnterPubRoomMutationVariables,
  Event,
  EventSubscription,
  FavoriteGame,
  FavoriteGameMutation,
  FavoriteGameMutationVariables,
  GetAccount,
  GetAccountQuery,
  GetAccountQueryVariables,
  GetComments,
  GetCommentsQuery,
  GetCommentsQueryVariables,
  GetFriends,
  GetFriendsQuery,
  GetFriendsQueryVariables,
  GetGames,
  GetGamesQuery,
  GetGamesQueryVariables,
  GetMessages,
  GetMessagesQuery,
  GetMessagesQueryVariables,
  GetRooms,
  GetRoomsQuery,
  GetRoomsQueryVariables,
  LeaveRoom,
  LeaveRoomMutation,
  LeaveRoomMutationVariables,
  ReadMessage,
  ReadMessageMutation,
  ReadMessageMutationVariables,
  ScFriendStatus,
  ScNewComment,
  ScNewInvite,
  ScNewRoom,
  ScUpdatePassword,
  ScUpdateRoom,
  ScUpdateRoomScreenshot,
  ScVoiceMsgKind,
  SendSignal,
  SendSignalMutation,
  SendSignalMutationVariables,
  SendVoiceMsg,
  SendVoiceMsgQuery,
  SendVoiceMsgQueryVariables,
  UpdateAccount,
  UpdateAccountMutation,
  UpdateAccountMutationVariables,
  UpdatePassword,
  UpdatePasswordMutation,
  UpdatePasswordMutationVariables,
  UpdateRoom,
  UpdateRoomMutation,
  UpdateRoomMutationVariables,
  UpdateRoomScreenshot,
  UpdateRoomScreenshotMutation,
  UpdateRoomScreenshotMutationVariables,
} from 'src/generated/graphql';
import { store, friendStore } from 'src/store';
import { request, subscribe } from 'src/services';
import { configure, parseAccount, Settings } from 'src/configure';
import { events, VoiceSingalEvent, Singal, SingalEvent } from 'src/constants';
import { i18n, isCurrentLang } from 'src/i18n';
import { logout } from 'src/auth';
import {
  convertObjectCamelCaseToSnake,
  convertObjectSnakeToCamelCase,
  documentVisible,
  playHintSound,
  playSound,
} from 'src/utils';

export const sendVoiceMsg = async (kind: ScVoiceMsgKind, payload: RTCSessionDescription | RTCIceCandidate) => {
  await request<SendVoiceMsgQuery, SendVoiceMsgQueryVariables>(SendVoiceMsg, {
    input: { json: JSON.stringify(convertObjectCamelCaseToSnake(JSON.parse(JSON.stringify(payload)))), kind },
  });
};

export const getGames = debounce(async () => {
  const { games, topGames, favorites } = await request<GetGamesQuery, GetGamesQueryVariables>(GetGames, {});
  const gameIds = games
    .map((e) => {
      store.games[e.id] = e;
      if (isCurrentLang(e)) return e.id;
    })
    .filter(isNotNullish);
  updateStore(store, {
    gameIds,
    favoriteIds: favorites.filter((id) => isCurrentLang(store.games[id]!)),
    topGameIds: [...new Set([...topGames, ...gameIds])].filter((id) => isCurrentLang(store.games[id]!)).splice(0, 5),
  });
});

export const getRooms = async () => {
  const { rooms } = await request<GetRoomsQuery, GetRoomsQueryVariables>(GetRooms, {});
  if (!store.gameIds?.length) await getGames();
  updateStore(store, {
    roomIds: rooms
      .filter(({ gameId }) => gameId in store.games && isCurrentLang(store.games[gameId]!))
      .map((e) => {
        store.rooms[e.id] = e;
        return e.id;
      }),
  });
};

export const createRoom = async (input: ScNewRoom) => {
  const { createRoom } = await request<CreateRoomMutation, CreateRoomMutationVariables>(CreateRoom, { input });
  configure.user!.playing = createRoom;
  updateStore(configure);
};

export const updateRoom = async (input: ScUpdateRoom) => {
  const { updateRoom } = await request<UpdateRoomMutation, UpdateRoomMutationVariables>(UpdateRoom, { input });
  configure.user!.playing = updateRoom;
  updateStore(configure);
};

export const updateRoomScreenshot = async (input: ScUpdateRoomScreenshot) => {
  request<UpdateRoomScreenshotMutation, UpdateRoomScreenshotMutationVariables>(
    UpdateRoomScreenshot,
    {
      input,
    },
    {
      ignoreError: true,
    },
  );
};

export const enterPubRoom = async (roomId: number) => {
  const { enterPubRoom } = await request<EnterPubRoomMutation, EnterPubRoomMutationVariables>(EnterPubRoom, {
    input: { roomId },
  });
  configure.user!.playing = enterPubRoom;
  updateStore(configure);
};

export const leaveRoom = async () => {
  await request<LeaveRoomMutation, LeaveRoomMutationVariables>(LeaveRoom, {});
  delete configure.user!.playing;
  updateStore(configure);
};

export const getAccount = async () => {
  const { account } = await request<GetAccountQuery, GetAccountQueryVariables>(GetAccount, {});
  updateStore(configure, {
    user: parseAccount(account),
  });
};

export const updateAccount = async ({
  nickname = configure.user!.nickname,
  settings = configure.user!.settings,
}: {
  nickname?: string;
  settings?: Settings;
}) => {
  const { updateAccount } = await request<UpdateAccountMutation, UpdateAccountMutationVariables>(UpdateAccount, {
    input: { nickname, settings: JSON.stringify(settings) },
  });
  updateStore(configure, {
    user: parseAccount(updateAccount),
  });
};

export const updatePassword = async (input: ScUpdatePassword) => {
  await request<UpdatePasswordMutation, UpdatePasswordMutationVariables>(UpdatePassword, {
    input,
  });
};

export const getFriends = async () => {
  const { friends, invites } = await request<GetFriendsQuery, GetFriendsQueryVariables>(GetFriends, {});
  updateStore(friendStore, {
    friendIds: friends.map((e) => {
      friendStore.friends[e.user.id] = e;
      return e.user.id;
    }),
    inviteIds: invites.map((e) => {
      friendStore.invites[e.id] = e;
      return e.id;
    }),
  });
};

export const applyFriend = async (username: string) => {
  await request<ApplyFriendMutation, ApplyFriendMutationVariables>(ApplyFriend, { input: { username } });
  Toast.open('success', i18n.get('tipApplyFriendSuccess'));
};

export const acceptFriend = async (targetId: number, accept: boolean) => {
  await request<AcceptFriendMutation, AcceptFriendMutationVariables>(AcceptFriend, { input: { targetId, accept } });
  if (accept) {
    friendStore.friends[targetId] = { ...friendStore.friends[targetId]!, status: ScFriendStatus.Accept };
  } else {
    friendStore.friendIds = friendStore.friendIds?.filter((id) => id !== targetId);
    delete friendStore.friends[targetId];
  }
  updateStore(friendStore);
};

export const deleteFriend = async (targetId: number) => {
  await acceptFriend(targetId, false);
  friendStore.messageIds[targetId]?.forEach((id) => delete friendStore.messages[id]);
  updateStore(friendStore, {
    draft: { ...friendStore.draft, [targetId]: undefined },
    messageIds: { ...friendStore.messageIds, [targetId]: undefined },
  });
};

export const createInvite = async (input: ScNewInvite) => {
  await request<CreateInviteMutation, CreateInviteMutationVariables>(CreateInvite, { input });
  Toast.open('success', i18n.get('tipIviteSuccess'));
};

export const acceptInvite = async (inviteId: number, accept: boolean) => {
  await request<AcceptInviteMutation, AcceptInviteMutationVariables>(AcceptInvite, { input: { inviteId, accept } });
  if (accept) {
    configure.user!.playing = friendStore.invites[inviteId]?.room;
    updateStore(configure);
  }
  friendStore.inviteIds = friendStore.inviteIds?.filter((id) => id !== inviteId);
  delete friendStore.invites[inviteId];
  updateStore(friendStore);
};

export const getComments = async (gameId: number) => {
  const { comments } = await request<GetCommentsQuery, GetCommentsQueryVariables>(GetComments, { input: { gameId } });
  store.comment[gameId] = {
    userIds: comments.map((e) => e.user.id),
    comments: Object.fromEntries(comments.map((e) => [e.user.id, e])),
  };
  updateStore(store);
};

export const createComment = async (input: ScNewComment) => {
  const { createComment } = await request<CreateCommentMutation, CreateCommentMutationVariables>(CreateComment, {
    input,
  });
  store.comment[input.gameId] = {
    userIds: [
      ...(store.comment[input.gameId]?.userIds?.filter((id) => configure.user!.id !== id) || []),
      configure.user!.id,
    ],
    comments: {
      ...store.comment[input.gameId]?.comments,
      [configure.user!.id]: createComment,
    },
  };
  updateStore(store);
};

export const getMessages = async (targetId: number) => {
  const { messages } = await request<GetMessagesQuery, GetMessagesQueryVariables>(GetMessages, { input: { targetId } });
  friendStore.messageIds[targetId] = messages.map((e) => {
    friendStore.messages[e.id] = e;
    return e.id;
  });
  updateStore(friendStore);
};

export const readMessage = debounce(async (targetId: number) => {
  const { readMessage } = await request<ReadMessageMutation, ReadMessageMutationVariables>(ReadMessage, {
    input: { targetId },
  });
  friendStore.friends[targetId] = readMessage;
  updateStore(friendStore);
});

export const createMessage = async (targetId: number, body: string) => {
  const { createMessage } = await request<CreateMessageMutation, CreateMessageMutationVariables>(CreateMessage, {
    input: { targetId, body },
  });
  friendStore.messageIds[targetId] = [...(friendStore.messageIds[targetId] || []), createMessage.id];
  friendStore.messages[createMessage.id] = createMessage;
  updateStore(friendStore);
  playHintSound('sended');
};

export const favoriteGame = async (gameId: number, favorite: boolean) => {
  await request<FavoriteGameMutation, FavoriteGameMutationVariables>(FavoriteGame, {
    input: {
      gameId,
      favorite,
    },
  });
  if (favorite) {
    store.favoriteIds = [...(store.favoriteIds || []), gameId];
  } else {
    store.favoriteIds = store.favoriteIds?.filter((id) => id !== gameId);
  }
  updateStore(store);
};

export const sendSignal = async (targetId: number, singal: Singal) => {
  await request<SendSignalMutation, SendSignalMutationVariables>(SendSignal, {
    input: { targetId, json: JSON.stringify(singal) },
  });
};

export const subscribeEvent = () => {
  const subscription = subscribe<EventSubscription>(Event);
  (async function () {
    for await (const { event } of subscription) {
      const {
        newMessage,
        newGame,
        updateRoom,
        deleteRoom,
        newInvite,
        deleteInvite,
        applyFriend,
        acceptFriend,
        deleteFriend,
        updateUser,
        sendSignal,
        login,
        voiceSignal,
      } = event;

      if (newMessage) {
        friendStore.messages[newMessage.id] = newMessage;
        const userId = newMessage.userId === configure.user?.id ? newMessage.targetId : newMessage.userId;
        friendStore.messageIds[userId] = [...(friendStore.messageIds[userId] || []), newMessage.id];
        if (friendStore.friendChatState !== newMessage.userId) {
          const friend = friendStore.friends[newMessage.userId];
          if (friend) {
            friendStore.friends[newMessage.userId] = {
              ...friend,
              unreadMessageCount: friend.unreadMessageCount + 1,
            };
          }
          playSound('new_message');
        } else {
          documentVisible().then(() => readMessage(newMessage.userId));
          playHintSound('received');
        }
        updateStore(friendStore);
      }

      if (newGame) {
        store.games[newGame.id] = newGame;
        if (isCurrentLang(newGame)) {
          updateStore(store, {
            gameIds: [...(store.gameIds || []), newGame.id],
          });
        }
      }

      if (updateRoom) {
        const originRoom = store.rooms[updateRoom.id];
        if (originRoom) {
          Object.assign(originRoom, updateRoom);
          updateStore(store);
        }
        if (configure.user?.playing?.id === updateRoom.id) {
          configure.user.playing = updateRoom;
          updateStore(configure);
        }
      }

      if (deleteRoom) {
        delete store.rooms[deleteRoom];
        updateStore(store, { roomIds: store.roomIds?.filter((id) => id !== deleteRoom) });
        if (configure.user && configure.user.playing?.id === deleteRoom) {
          if (configure.user.playing.host !== configure.user.id) {
            Toast.open('warning', i18n.get('tipRoomDeleted'));
          }
          delete configure.user.playing;
          updateStore(configure);
        }
      }

      if (newInvite) {
        friendStore.invites[newInvite.id] = newInvite;
        updateStore(friendStore, {
          inviteIds: [...(friendStore.inviteIds || []), newInvite.id],
        });
        playSound('new_invite');
      }

      if (deleteInvite) {
        delete friendStore.invites[deleteInvite];
        updateStore(friendStore, { inviteIds: friendStore.inviteIds?.filter((id) => id !== deleteInvite) });
      }

      if (applyFriend) {
        friendStore.friends[applyFriend.user.id] = applyFriend;
        updateStore(friendStore, {
          friendIds: [...new Set([...(friendStore.friendIds || []), applyFriend.user.id])],
        });
        playSound('apply_friend');
      }

      if (acceptFriend) {
        friendStore.friends[acceptFriend.user.id] = acceptFriend;
        updateStore(friendStore, {
          friendIds: [...new Set([...(friendStore.friendIds || []), acceptFriend.user.id])],
        });
      }

      if (deleteFriend) {
        delete friendStore.friends[deleteFriend];
        friendStore.messageIds[deleteFriend]?.forEach((id) => delete friendStore.messages[id]);
        updateStore(friendStore, {
          friendIds: friendStore.friendIds?.filter((id) => id !== deleteFriend),
          messageIds: { ...friendStore.messageIds, [deleteFriend]: undefined },
          draft: { ...friendStore.draft, [deleteFriend]: undefined },
        });
      }

      if (updateUser) {
        const friend = friendStore.friends[updateUser.id];
        if (friend) {
          friendStore.friends[updateUser.id] = { ...friend, user: updateUser };
          updateStore(friendStore);
        }
      }

      if (sendSignal) {
        window.dispatchEvent(
          new CustomEvent<SingalEvent>(events.SINGAL, {
            detail: { userId: sendSignal.userId, singal: JSON.parse(sendSignal.json) },
          }),
        );
      }

      if (voiceSignal) {
        window.dispatchEvent(
          new CustomEvent<VoiceSingalEvent>(events.VOICE_SINGAL, {
            detail: {
              roomId: voiceSignal.roomId,
              singal: convertObjectSnakeToCamelCase(JSON.parse(voiceSignal.json)),
            },
          }),
        );
      }

      if (login) {
        logout();
      }
    }
  })();
  return subscription;
};
